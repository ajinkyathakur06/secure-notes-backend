import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';


//Mock Bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

//Mock Prisma
const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

//Mock JWT
const jwtMock = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  //Signup Tests
  describe('signup', () => {
    //1.1=>should signup successfully
    it('should signup a new user when email does not exist already', async () => {
      const dto = {
        name: 'Test User',
        email: 'test@gmail.com',
        password: 'Password@123',
      };
      prismaMock.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      prismaMock.user.create.mockResolvedValue({
        user_id: '1',
        name: dto.name,
        email: dto.email,
        password: 'hashed-password',
      });

      jwtMock.sign.mockReturnValue('fake-jwt-token');

      const result = await service.signup(dto);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { email: dto.email } });
      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(jwtMock.sign).toHaveBeenCalled();

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        user: {
          user_id: '1',
          name: dto.name,
          email: dto.email,
        },
      });
      
    });


    //1.2. Test for signup=> should throw error if email already exists

    it('should throw error if email already exists',async()=>{
      prismaMock.user.findUnique.mockResolvedValue({email:'test@gmail.com',

      });
      await expect(
        service.signup({
          name:'Test',
          email:'test@gmail.com',
          password:'Password@123',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
      expect(jwtMock.sign).not.toHaveBeenCalled();
    });
  });




  //2. Login Tests

  describe('login',()=>{
    //2.1. Login successfully with correct credentials

    it('should login successfully with correct credentials',async()=>{
      //data to send
      const dto={
        email:'test@gmail.com',
        password:'Password@123',
      };

      //find user is present or not 
      prismaMock.user.findUnique.mockResolvedValue({
        user_id:'1',
        name:'Test User',
        email:dto.email,
        password:'hashed-password',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtMock.sign.mockReturnValue('fake-jwt-token');

      const result=await service.login(dto);
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(jwtMock.sign).toHaveBeenCalled();

      expect(result).toEqual({
        access_token: 'fake-jwt-token',
        user: {
          user_id: '1',
          name: 'Test User',
          email: dto.email,
        },
      });
      

    });

    //2.2 throw error if user does not exists
    it('should throw error if user does not exist',async()=>{
      prismaMock.user.findUnique.mockResolvedValue(null);
      
      await expect(
        service.login({
          email:'wrong@gmail.com',
          password:'Password@123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    //2.3 error for incorrect password
    it('should throw error if password is incorrect', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        user_id: '1',
        name: 'Test User',
        email: 'test@gmail.com',
        password: 'hashed-password',
      });

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.login({
          email: 'test@gmail.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(jwtMock.sign).not.toHaveBeenCalled();
    });
  });

  //3.reset password

  describe('resetPassword',  () => {
    //3.1 reset password if match
    it('should reset password when passwords match', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hash');
      prismaMock.user.update.mockResolvedValue({});

      const result = await service.resetPassword('1', {
        password: 'NewPass@123',
        confirmPassword: 'NewPass@123',
      });

      expect(prismaMock.user.update).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Password updated successfully',
      });
    });
    
    //3.2 if not match throw error 
    it('should throw error when passwords do not match', async () => {
      await expect(
        service.resetPassword('1', {
          password: 'NewPass@123',
          confirmPassword: 'WrongPass',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
  });
});



