import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [PrismaModule, AuthModule,
     ConfigModule.forRoot({
      isGlobal: true,
    }),
     NotesModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
