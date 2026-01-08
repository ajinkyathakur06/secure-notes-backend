import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy {
  

    constructor(){
          console.log('DB URL:', process.env.DATABASE_URL);
          const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined');
    }
        const adapter=new PrismaPg({
            connectionString:process.env.DATABASE_URL as string,
        });
        super({adapter});
    }
    async onModuleInit() {
        await this.$connect();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
}
