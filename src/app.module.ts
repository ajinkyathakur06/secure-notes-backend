import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ExtractorModule } from './extractor/extractor.module';

import { UserModule } from './user/user.module';
import { NotesModule } from './notes/notes.module';
import { ShareModule } from './share/share.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ExtractorModule,
    AuthModule,
    UserModule,
    NotesModule,
    ShareModule,
    WebsocketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
