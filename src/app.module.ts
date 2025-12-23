import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
//import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ExtractorModule } from './extractor/extractor.module';


@Module({
  imports: [PrismaModule,
     ConfigModule.forRoot({
      isGlobal: true,
    }),
     ExtractorModule,],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
