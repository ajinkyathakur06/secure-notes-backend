import {BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
    constructor( private readonly prisma:PrismaService,
        private readonly jwtService:JwtService){}


    async signup(dto:RegisterDto){
            //check email already exist
             const existingUser = await this.prisma.user.findUnique({
                    where: { email: dto.email },});

              if (existingUser) {
                throw new BadRequestException('Email already registered');
              }
              const hashedPassword=await bcrypt.hash(dto.password,10);

              //create user 
              const user=await this.prisma.user.create(
                {
                    data:
                {
                    name:dto.name,
                    email:dto.email,
                    password:hashedPassword,
                },
              });
              // jwt
              const payload = {
                 userId: user.user_id,
                 email: user.email,
              };

              const access_token = this.jwtService.sign(payload);
              return {
                access_token,
                user: {
                  user_id: user.user_id,
                  name: user.name,
                  email: user.email,
                },
    };

    }
    async login(dto:LoginDto){
            //find user by email
                const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid email or password');
    }

    //  Compare password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    //  Generate JWT
    const payload = {
      userId: user.user_id,
      email: user.email,
    };

    const access_token = this.jwtService.sign(payload);


    return {
      access_token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      },
    };
    }
    }


