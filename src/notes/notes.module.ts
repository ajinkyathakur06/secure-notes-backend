import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';
import { ShareModule } from 'src/share/share.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports:[
    PrismaModule,ShareModule
  ],
  controllers: [NotesController],
  providers: [NotesService]
})
export class NotesModule {}
