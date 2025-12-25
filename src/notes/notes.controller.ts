import { Controller,Body,Req,Post,Get,Param,Delete,Patch, UseGuards, Query, Res } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto } from './dto/create_note.dto';
import { UpdateNoteDto } from './dto/update_note.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
    constructor(private readonly noteService:NotesService){

    }
    //create note
    @Post()
    create(@Req() req,@Body() dto:CreateNoteDto){
        return this.noteService.create(req.user.userId,dto);
    }

    

    //Get all owned notes
    @Get('owned')
    getOwnedNotes(@Req() req){
        return this.noteService.getOwnedNotes(req.user.userId);
    }

    //get trash notes
    @Get('trash')
        getTrash(@Req() req) {
        return this.noteService.getTrash(req.user.userId);
    }

   
    //Get note by ID
    @Get(':noteId')
    getOne(@Req() req,@Param('noteId') noteId:string){
        return this.noteService.getOne(noteId,req.user.userId);
    }

    //Update note
    @Patch(':noteId')
    update(
        @Req() req,
        @Param('noteId') noteId:string,
        @Body() dto:UpdateNoteDto,
    ){
        return this.noteService.update(noteId,req.user.userId,dto);
    }

    //restore 
    @Patch(':noteId/restore')
restore(
  @Req() req,
  @Param('noteId') noteId: string,
) {
  return this.noteService.restore(noteId, req.user.userId);
}

    //Delete note
    //scope=me delete for current user
    //scope=all delete for everyone (owner only)

    @Delete(':noteId')
    delete(
        @Req() req,
        @Param('noteId') noteId:string,
        @Query('scope') scope:'me'|'all',
    ){
        return this.noteService.delete(noteId,req.user.userId,scope)
    }
    
    //Download note
    @Get(':noteId/download')
    async download(
        @Req()req,
        @Param('noteId') noteId:string,
        @Res() res){
         const {filename,content}=await this.noteService.download(noteId,req.user.userId);
         res.set({
            'Content-Type':'text/plain',
            'Content-Disposition':`attachment; filename="${filename}"`,
         });
         res.send(content);
    }
}
