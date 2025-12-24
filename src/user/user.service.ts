import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // Get profile
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Update profile (name only)
  async updateProfile(userId: string, name: string) {
    return this.prisma.user.update({
      where: { user_id: userId },
      data: { name },
      select: {
        user_id: true,
        name: true,
        email: true,
        updatedAt: true,
      },
    });
  }
}
