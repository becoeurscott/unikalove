import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        role: true,
        plan: true,
        status: true,
        createdAt: true,
        profile: { include: { photos: true, interests: { include: { interest: true } } } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async setStatus(id: string, status: UserStatus) {
    await this.getById(id);
    const user = await this.prisma.user.update({ where: { id }, data: { status } });
    if (status !== 'ACTIVE') {
      await this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { id: user.id, status: user.status };
  }

  /** GDPR-style soft delete: account unusable, data retained for erasure job. */
  async softDelete(id: string) {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { status: 'DELETED', deletedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
