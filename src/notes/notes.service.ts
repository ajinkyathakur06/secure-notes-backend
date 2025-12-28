import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNoteDto } from './dto/create_note.dto';
import { UpdateNoteDto } from './dto/update_note.dto';
import { ShareService } from '../share/share.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService, private readonly shareService: ShareService) {

  }
  //For getting shared notes check ShareService
  async getOwnedNotes(userId: string) {
    return await this.prisma.notes.findMany({
      where: {
        user_id: userId,
        OR: [
          {
            noteMeta: {
              none: {
                user_id: userId,
              },
            },
          },
          {
            noteMeta: {
              some: {
                user_id: userId,
                is_deleted: false,

              },
            },
          },
        ],

      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        note_id: true,
        title: true,
        content: true,
        updatedAt: true,
      },

    });

  }

  //get all notes
  async getAllNotes(userId: string) {
    const owned = await this.prisma.notes.findMany({
      where: {
        user_id: userId,
        OR: [
          {
            noteMeta: {
              none: { user_id: userId },
            },
          },
          {
            noteMeta: {
              some: {
                user_id: userId,
                is_deleted: false,
              },
            },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        note_id: true,
        title: true,
        content: true,
        updatedAt: true,
      },
    });

    const other = await this.shareService.getSharedNotes(userId);

    return {
      owned,
      other,
    };
  }

  //download as txt
  async download(noteId: string, userId: string) {
    const note = await this.getOne(noteId, userId);

    const text = `Title: ${note.title}\n\n${note.content}`;

    return {
      filename: `${note.title}.txt`,
      content: text,
    };
  }
  //delete note
  async delete(noteId: string, userId: string, scope: 'me' | 'all') {
    const note = await this.prisma.notes.findUnique({
      where: { note_id: noteId },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    //Owner can delete for  everyone
    if (scope === 'all') {
      if (note.user_id !== userId) {
        throw new ForbiddenException('Only owner can delete note for everyone',);
      }
      return this.prisma.notes.delete({
        where: { note_id: noteId },
      });
    }

    //delete for me owner or shared user
    return this.prisma.userNoteMeta.upsert({
      where: {
        user_id_note_id: {
          user_id: userId,
          note_id: noteId,
        },
      },
      create: {
        user_id: userId,
        note_id: noteId,
        is_deleted: true,
        deletedAt: new Date(),


      },
      update: {
        is_deleted: true,
        deletedAt: new Date(),
      }
    });
  }

  //trash
  async getTrash(userId: string) {
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000,
    );

    return this.prisma.userNoteMeta.findMany({
      where: {
        user_id: userId,
        is_deleted: true,
        deletedAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        note: {
          select: {
            note_id: true,
            title: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });
  }
  //restore
  async restore(noteId: string, userId: string) {
    const meta = await this.prisma.userNoteMeta.findUnique({
      where: {
        user_id_note_id: {
          user_id: userId,
          note_id: noteId,
        },
      },
    });

    if (!meta || !meta.is_deleted) {
      throw new NotFoundException('Note not in trash');
    }

    return this.prisma.userNoteMeta.update({
      where: {
        user_id_note_id: {
          user_id: userId,
          note_id: noteId,
        },
      },
      data: {
        is_deleted: false,
        deletedAt: null,
      },
    });
  }


  //get note
  async getOne(noteId: string, userId: any) {
    const note = await this.prisma.notes.findUnique({
      where: { note_id: noteId },
      include: {
        noteMeta: {
          where: { user_id: userId },
          select: { is_deleted: true },
        },
        requests: {
          include: {
            receiver: {
              select: {
                user_id: true,
                name: true,
                email: true,
              }
            }
          }
        }
      },
    });

    //if note does not exist 
    if (!note) {
      throw new NotFoundException('Note not found ');
    }

    //if user has deleted note
    if (note.noteMeta.length && note.noteMeta[0].is_deleted) {
      throw new NotFoundException('Note not found ');
    }

    //owner can view
    if (note.user_id === userId) {
      return note;
    }

    //check for shared access for not owner
    const shared = await this.prisma.request.findFirst({
      where: {
        note_id: noteId,
        receiver_id: userId,
        status: 'ACCEPTED'
      },
    });
    if (!shared) {
      throw new ForbiddenException("You do not have access to this note");
    }
    return note;
  }

  //update
  async update(noteId: string, userId: any, dto: UpdateNoteDto) {
    const note = await this.prisma.notes.findUnique({
      where: { note_id: noteId },
    });
    if (!note) {
      throw new NotFoundException('Note not found');
    }

    //always owner can update
    if (note.user_id === userId) {
      return this.prisma.notes.update({
        where: { note_id: noteId },
        data: { ...dto }
      });
    }

    //check shared person has edit access
    const sharedEditAccess = await this.prisma.request.findFirst({
      where: {
        note_id: noteId,
        receiver_id: userId,
        status: 'ACCEPTED',
        permission: 'EDIT',
      },
    });

    if (!sharedEditAccess) {
      throw new ForbiddenException('You do not have edit access to this note ');
    }

    //shared user with edit permission
    return this.prisma.notes.update({
      where: { note_id: noteId },
      data: { ...dto, }
    })


  }


  //Create Note
  async create(userId: string, dto: CreateNoteDto) {
    return this.prisma.notes.create({
      data: {
        user_id: userId,
        title: dto.title,
        content: dto.content,
      },
    });
  }
}
