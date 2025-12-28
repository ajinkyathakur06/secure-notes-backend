import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });
//1. Get Profile
//1.1 Get profile if user exist

  it('should return user profile if user exists', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      user_id: 'user1',
      name: 'Saloni',
      email: 'saloni@test.com',
      createdAt: new Date(),
    });

    const result = await service.getProfile('user1');

    expect(result.user_id).toBe('user1');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { user_id: 'user1' },
      select: {
        user_id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  });
//1.2. user not found if does not exist
  it('should throw NotFoundException if user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getProfile('user1')).rejects.toThrow(
      NotFoundException,
    );
  });

  //2. Update profile

  it('should update user profile name', async () => {
    mockPrisma.user.update.mockResolvedValue({
      user_id: 'user1',
      name: 'Updated Name',
      email: 'saloni@test.com',
      updatedAt: new Date(),
    });

    const result = await service.updateProfile('user1', 'Updated Name');

    expect(result.name).toBe('Updated Name');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { user_id: 'user1' },
      data: { name: 'Updated Name' },
      select: {
        user_id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });
  });
});
