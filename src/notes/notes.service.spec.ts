import {Test,TestingModule} from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShareService } from '../share/share.service';
import { ForbiddenException,NotFoundException } from '@nestjs/common';


describe('NotesService',()=>{
    let service:NotesService;
    let prisma:PrismaService;
    let shareService:ShareService;

    const mockPrisma={
        notes:{
            findMany:jest.fn(),
            findUnique:jest.fn(),
            findFirst:jest.fn(),
            create:jest.fn(),
            update:jest.fn(),
            delete:jest.fn(),
        },

        request:{
            findFirst:jest.fn(),
        },

        userNoteMeta:{
            upsert:jest.fn(),
            findMany:jest.fn(),
            findUnique:jest.fn(),
            update:jest.fn(),
        },
    };

    const mockShareService={
        getSharedNotes:jest.fn(),
    };

    beforeEach(async()=>{
        const module:TestingModule=await Test.createTestingModule({
            providers:[
                NotesService,
                { provide: PrismaService,useValue:mockPrisma},
                { provide:ShareService,useValue:mockShareService},
            ],
        }).compile();

        service=module.get<NotesService>(NotesService);
        prisma=module.get<PrismaService>(PrismaService);
        shareService=module.get<ShareService>(ShareService);

        jest.clearAllMocks();
    });

    //Tests

    //1.Get Owned Notes
    it('should return owned notes',async()=>{
        mockPrisma.notes.findMany.mockResolvedValue([{note_id:'1'}]);

        const result=await service.getOwnedNotes('user1');
        expect(result).toHaveLength(1);
        expect(prisma.notes.findMany).toHaveBeenCalled();
    });

    //2.Get All Notes
     it('should return owned and shared notes', async () => {
    mockPrisma.notes.findMany.mockResolvedValue([{ note_id: '1' }]);
    mockShareService.getSharedNotes.mockResolvedValue([{ note_id: '2' }]);

    const result = await service.getAllNotes('user1');

    expect(result.owned).toHaveLength(1);
    expect(result.other).toHaveLength(1);
  });

  //3.get one note

  //3.1 owner should access note 
  it('should allow owner to access a note',async()=>{
    mockPrisma.notes.findFirst.mockResolvedValue({
        note_id:'1',
        user_id:'user1',
        noteMeta:[],
        requests:[],
    });

    const note=await service.getOne('1','user1');
    expect(note.note_id).toBe('1');
  });

  //3.2 should throw error if note not found
  it('should throw if note not found',async()=>{
    mockPrisma.notes.findFirst.mockResolvedValue(null);

    await expect(
      service.getOne('1','user1'),
    ).rejects.toThrow(NotFoundException,);
  });

  

 
  //4. Create Note
  it('should create a note',async()=>{
    mockPrisma.notes.create.mockResolvedValue({note_id:'1'});

    const note=await service.create('user1',{
        title:'Test',
        content:'Content',
    });
    expect(note.note_id).toBe('1');
  });

  //5.update note
  //5.1 allow to update note owner
    it('should allow owner to update note',async()=>{
          mockPrisma.notes.findFirst.mockResolvedValue({
          note_id:'1',
          user_id:'user1',
        });

        mockPrisma.notes.update.mockResolvedValue({title:'Updated'});
        const result=await service.update('1','user1',{title:'Updated'});
        expect(result.title).toBe('Updated');


    });


    //5.2 shared user with edit permission should be allowed to update
    it('should allow shared user with EDIT permission to update',async()=>{
        mockPrisma.notes.findFirst.mockResolvedValue(null);

        mockPrisma.request.findFirst.mockResolvedValue({
  permission: 'EDIT',
});


        mockPrisma.notes.update.mockResolvedValue({title:'Updated'});
        const result=await service.update('1','user2',{title:'Updated'});
        expect(result.title).toBe('Updated');
    });

   //5.3 should block update without permission for shared user

   it('should block update without permission',async()=>{
    mockPrisma.notes.findFirst.mockResolvedValue(null);//no owner

    mockPrisma.request.findFirst.mockResolvedValue(null);

    await expect(
        service.update('1','user2',{title:'Updated'}),

    ).rejects.toThrow(ForbiddenException);
   });

   //6. Delete Note

   //6.1 delete for everyone by owner
     it('should allow owner to delete for everyone', async () => {
    mockPrisma.notes.findFirst.mockResolvedValue({
      note_id: '1',
      user_id: 'user1',
    });

    mockPrisma.notes.delete.mockResolvedValue({});

    await service.delete('1', 'user1', 'all');
    expect(prisma.notes.delete).toHaveBeenCalled();
  });

  //6.2 delete for me for owner or shared user
    it('should  delete note for me', async () => {
   

    await service.delete('1', 'user2', 'me');

    expect(prisma.userNoteMeta.upsert).toHaveBeenCalled();
  });

  //7. restore

   it('should restore deleted note', async () => {
    mockPrisma.userNoteMeta.findUnique.mockResolvedValue({
      is_deleted: true,
    });

    mockPrisma.userNoteMeta.update.mockResolvedValue({ is_deleted: false });

    const result = await service.restore('1', 'user1');
    expect(result.is_deleted).toBe(false);
  });


  
});