import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    ConnectedSocket,
    MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
    userId?: string;
}

@WebSocketGateway({
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    },
})
export class NotesGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    async handleConnection(client: AuthenticatedSocket) {
        try {
            // Extract token from handshake
            const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                client.disconnect();
                return;
            }

            // Verify JWT
            const payload = this.jwtService.verify(token);
            client.userId = payload.userId; // Payload uses userId, not sub

            // Join user-specific room for dashboard updates
            client.join(`user:${client.userId}`);

            console.log(`Client connected: ${client.id}, User: ${client.userId}`);
        } catch (error) {
            console.error('Authentication failed:', error);
            client.disconnect();
        }
    }

    handleDisconnect(client: AuthenticatedSocket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('join-note')
    async handleJoinNote(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { noteId: string },
    ) {
        try {
            const { noteId } = data;
            const userId = client.userId;

            if (!userId) {
                return { error: 'Unauthorized' };
            }

            // Verify user has access to this note
            const note = await this.prisma.notes.findUnique({
                where: { note_id: noteId },
                include: {
                    requests: {
                        where: {
                            receiver_id: userId,
                            status: 'ACCEPTED',
                        },
                    },
                },
            });

            if (!note) {
                return { error: 'Note not found' };
            }

            // Check if user is owner or has accepted share request
            const hasAccess = note.user_id === userId || note.requests.length > 0;

            if (!hasAccess) {
                return { error: 'Access denied' };
            }

            // Join the room
            client.join(`note:${noteId}`);

            // Notify others in the room
            client.to(`note:${noteId}`).emit('user-joined', {
                userId,
                noteId,
            });

            return { success: true, noteId };
        } catch (error) {
            console.error('Error joining note:', error);
            return { error: 'Failed to join note' };
        }
    }

    @SubscribeMessage('leave-note')
    async handleLeaveNote(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { noteId: string },
    ) {
        const { noteId } = data;
        client.leave(`note:${noteId}`);

        // Notify others
        client.to(`note:${noteId}`).emit('user-left', {
            userId: client.userId,
            noteId,
        });

        return { success: true };
    }

    @SubscribeMessage('note-update')
    async handleNoteUpdate(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { noteId: string; title: string; content: string },
    ) {
        try {
            const { noteId, title, content } = data;
            const userId = client.userId;

            if (!userId) {
                return { error: 'Unauthorized' };
            }

            // Verify user has permission (Fetch all collaborators to notify them later)
            const noteCtx = await this.prisma.notes.findUnique({
                where: { note_id: noteId },
                include: {
                    requests: {
                        where: {
                            status: 'ACCEPTED',
                        },
                    },
                },
            });

            if (!noteCtx) {
                return { error: 'Note not found' };
            }

            // Check permissions
            const isOwner = noteCtx.user_id === userId;
            const userRequest = noteCtx.requests.find(r => r.receiver_id === userId);
            const hasEditPermission = userRequest?.permission === 'EDIT';

            if (!isOwner && !hasEditPermission) {
                return { error: 'No edit permission' };
            }

            // Update the note in database
            await this.prisma.notes.update({
                where: { note_id: noteId },
                data: { title, content, updatedAt: new Date() },
            });

            const updatePayload = {
                noteId,
                title,
                content,
                updatedBy: userId,
                timestamp: new Date().toISOString(),
            };

            // 1. Broadcast to active note room (for open modals)
            client.to(`note:${noteId}`).emit('note-updated', updatePayload);

            // 2. Broadcast to all collaborators' dashboards (owner + shared users)
            // Notify owner
            this.server.to(`user:${noteCtx.user_id}`).emit('dashboard-note-update', updatePayload);

            // Notify collaborators
            noteCtx.requests.forEach(req => {
                if (req.receiver_id) {
                    this.server.to(`user:${req.receiver_id}`).emit('dashboard-note-update', updatePayload);
                }
            });

            return { success: true };
        } catch (error) {
            console.error('Error updating note:', error);
            return { error: 'Failed to update note' };
        }
    }

    @SubscribeMessage('cursor-update')
    handleCursorUpdate(
        @ConnectedSocket() client: AuthenticatedSocket,
        @MessageBody() data: { noteId: string; position: number; selection?: { start: number; end: number } },
    ) {
        const { noteId, position, selection } = data;

        // Broadcast cursor position to others in the room
        client.to(`note:${noteId}`).emit('cursor-updated', {
            userId: client.userId,
            position,
            selection,
        });

        return { success: true };
    }
}
