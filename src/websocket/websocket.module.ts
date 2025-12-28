import { Module } from '@nestjs/common';
import { NotesGateway } from './notes.gateway';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || 'your-secret-key',
            signOptions: { expiresIn: '7d' },
        }),
        PrismaModule,
    ],
    providers: [NotesGateway],
})
export class WebsocketModule { }
