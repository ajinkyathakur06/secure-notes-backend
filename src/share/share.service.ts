import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShareDto } from './dto/create-share.dto';
import { RespondShareDto } from './dto/respond-share.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class ShareService {
  constructor(private readonly prisma: PrismaService) {}

  // 1️⃣ Create share request
  async createShare(ownerId: string, dto: CreateShareDto) {
    const note = await this.prisma.notes.findFirst({
      where: {
        note_id: dto.noteId,
        user_id: ownerId,
      },
    });

    if (!note) {
      throw new ForbiddenException('Not note owner');
    }

    const receiver = await this.prisma.user.findUnique({
  where: {
    email: dto.receiverEmail,
  },
});

if (!receiver) {
  throw new ForbiddenException('Receiver not found');
}

if (receiver.user_id === ownerId) {
  throw new ForbiddenException('Cannot share note with yourself');
}

    return this.prisma.request.create({
      data: {
        note_id: dto.noteId,
        sender_id: ownerId,
        receiver_id: receiver.user_id,
        permission: dto.permission,
        status: 'PENDING',
      },
    });
  }

  // 2️⃣ Get pending requests
  async getPendingRequests(userId: string) {
    return this.prisma.request.findMany({
      where: {
        receiver_id: userId,
        status: 'PENDING',
      },
      include: {
        note: {
          select: {
            note_id: true,
            title: true,
          },
        },
        sender: {
          select: {
            user_id: true,
            email: true,
          },
        },
      },
    });
  }

  // 3️⃣ Accept / Reject request
  async respondToRequest(userId: string, dto: RespondShareDto) {
    const request = await this.prisma.request.findUnique({
      where: { request_id: dto.requestId },
    });

    if (!request || request.receiver_id !== userId) {
      throw new ForbiddenException();
    }

    if (dto.action === 'ACCEPT') {
      await this.prisma.userNoteMeta.create({
        data: {
          user_id: userId,
          note_id: request.note_id,
        },
      });
    }

    return this.prisma.request.update({
      where: { request_id: dto.requestId },
      data: {
        status: dto.action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED',
      },
    });
  }

  // 4️⃣ Update permission (owner only)
  async updatePermission(ownerId: string, dto: UpdatePermissionDto) {
      // 1️⃣ Verify owner
      const note = await this.prisma.notes.findFirst({
        where: {
          note_id: dto.noteId,
          user_id: ownerId,
        },
      });
  
      if (!note) {
        throw new ForbiddenException('Only owner can update permission');
      }
  
      // 2️⃣ Update permission in REQUEST (source of truth)
      return this.prisma.request.updateMany({
        where: {
          note_id: dto.noteId,
          receiver_id: dto.userId,
          status: 'ACCEPTED',
        },
        data: {
          permission: dto.permission,
        },
      });
    }


  // 5️⃣ Revoke access
  async revokeAccess(
    ownerId: string,
    params: { noteId: string; userId: string },
  ) {
    const { noteId, userId } = params;

    const note = await this.prisma.notes.findFirst({
      where: {
        note_id: noteId,
        user_id: ownerId,
      },
    });

    if (!note) {
      throw new ForbiddenException();
    }

    return this.prisma.userNoteMeta.deleteMany({
      where: {
        note_id: noteId,
        user_id: userId,
      },
    });
  }

  // 6️⃣ Get shared notes (used by Notes module)
  async getSharedNotes(userId: string) {
    return this.prisma.notes.findMany({
      where: {
        requests: {
          some: {
            receiver_id: userId,
            status: 'ACCEPTED',
          },
        },
        noteMeta: {
          none: {
            user_id: userId,
            is_deleted: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        note_id: true,
        title: true,
        content:true,
        updatedAt: true,
        user_id: true, // owner
      },
    });
  }
}
