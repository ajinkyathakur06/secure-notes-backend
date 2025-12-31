import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
    if (!noteId || !userId) {
      throw new BadRequestException('Invalid request');
    }
    const note = await this.getOne(noteId, userId);

    const text = `Title: ${note.title}\n\n${note.content}`;

    return {
      filename: `${note.title}.txt`,
      content: text,
    };
  }

  //delete note
  async delete(noteId: string, userId: string, scope: 'me' | 'all') {
    if (!noteId || !userId) {
       throw new BadRequestException('Invalid request');
    }

    if(scope!== 'me' && scope!=='all'){
      throw new BadRequestException('Invalid delete scope');
    }

    //Owner can delete for  everyone
    if (scope === 'all') {
        
        const note=await this.prisma.notes.findFirst({
        where:{
          note_id:noteId,
          user_id:userId, //this will fetch note only if user is owner
        },
      });

      if(!note){
        throw new ForbiddenException('Only owner can delete note for everyone!!');
      }

      //delete for everyone with single query used cascade delete to delete related tables( from requests, usernotemeta)
      return this.prisma.notes.delete({
        where:{note_id:noteId},
      });
    }

    //delete for me owner or shared user (via usernotemeta table)
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
    if (!noteId || !userId) {
      throw new BadRequestException('Invalid request');
    }
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


  //get note (Get a single note by owner and the user who accepted the shared note)
  async getOne(noteId: string, userId: any) {
    if (!noteId || !userId) {
  throw new BadRequestException('Invalid request');
}
    const note = await this.prisma.notes.findFirst({
      where: { 
        note_id: noteId,
        OR:[
          //owner can always access
          {user_id:userId}, //for owner

          //shared user with accepted access
          {
            requests:{
              some:{
                receiver_id:userId,
                status:'ACCEPTED',
              },
            },
          },

        ],

      },


      include: {
        //check if user has deleted the note
        noteMeta: {
          where: { user_id: userId },
          select: { is_deleted: true },
        },
        //Include sharing info
        requests: {
          include: {
            receiver: {
              select: {
                user_id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    //if note does not exist or user has no access if checked for shared user
    if (!note) {
      throw new NotFoundException('Note not found ');
    }

    //if user has deleted note or moved to trash
    if (note.noteMeta?.[0]?.is_deleted) {
      throw new NotFoundException('Note not found');
    }

    //access granted user who not deleted note or owner with no deletion get the note
    return note;
  }

  //update
  async update(noteId: string, userId: any, dto: UpdateNoteDto) {
    if (!noteId || !userId) {
      throw new BadRequestException('Invalid request');
    }
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('Nothing to update');
    }
     const updateData: any={};

     if(dto.title !== undefined){
      if(!dto.title.trim()){
        throw new BadRequestException('Title can not be empty');
      }
      updateData.title=dto.title.trim();
     }

     if(dto.content !==undefined){
        if(!dto.content.trim()){
          throw new BadRequestException('Content cannot be empty');
        }
        updateData.content=dto.content.trim();
     }

    //if the note available for current user who is owner will update 
     const ownerNote=await this.prisma.notes.findFirst({
      where:{
        note_id:noteId,
        user_id:userId,
      },
     });

     if(ownerNote){
      return this.prisma.notes.update({
        where:{note_id:noteId},
        data:{...updateData},
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
      data: { ...updateData, }
    });


  }


  //Create Note
  async create(userId: string, dto: CreateNoteDto) {
     if (!userId) {
    throw new BadRequestException('Invalid user');
  }

  if (!dto.title?.trim() || !dto.content?.trim()) {
    throw new BadRequestException('Title and content cannot be empty');
  }
    return this.prisma.notes.create({
      data: {
        user_id: userId,
        title: dto.title,
        content: dto.content,
      },
    });
  }
}
