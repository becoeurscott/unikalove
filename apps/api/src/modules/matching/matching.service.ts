import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SwipeType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const FREE_DAILY_LIKE_LIMIT = 20;
const LIKE_TYPES: SwipeType[] = ['LIKE', 'SUPERLIKE'];

@Injectable()
export class MatchingService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async swipe(userId: string, plan: string, targetId: string, type: SwipeType) {
    if (targetId === userId) throw new BadRequestException('Cannot swipe yourself');
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.status !== 'ACTIVE') throw new NotFoundException('User not found');

    if (plan === 'FREE' && LIKE_TYPES.includes(type)) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const todayLikes = await this.prisma.swipe.count({
        where: { actorId: userId, type: { in: LIKE_TYPES }, createdAt: { gte: startOfDay } },
      });
      if (todayLikes >= FREE_DAILY_LIKE_LIMIT) {
        throw new ForbiddenException('Daily like limit reached — upgrade to Premium');
      }
    }

    const swipe = await this.prisma.swipe.upsert({
      where: { actorId_targetId: { actorId: userId, targetId } },
      create: { actorId: userId, targetId, type },
      update: { type },
    });

    let match = null;
    if (LIKE_TYPES.includes(type)) {
      const reciprocal = await this.prisma.swipe.findUnique({
        where: { actorId_targetId: { actorId: targetId, targetId: userId } },
      });
      if (reciprocal && LIKE_TYPES.includes(reciprocal.type)) {
        match = await this.createMatch(userId, targetId);
      } else {
        await this.notifications.create(targetId, 'NEW_LIKE', 'Quelqu’un vous aime bien !', {
          fromUserId: userId,
        });
      }
    }
    return { swipe, match };
  }

  private async createMatch(a: string, b: string) {
    // Canonical ordering so (a,b) and (b,a) map to one row.
    const [userAId, userBId] = [a, b].sort();
    const match = await this.prisma.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId, conversation: { create: {} } },
      update: { status: 'ACTIVE' },
      include: { conversation: true },
    });
    await Promise.all([
      this.notifications.create(a, 'NEW_MATCH', 'Nouveau match ! 🎉', { matchId: match.id }),
      this.notifications.create(b, 'NEW_MATCH', 'Nouveau match ! 🎉', { matchId: match.id }),
    ]);
    return match;
  }

  async listMatches(userId: string) {
    return this.prisma.match.findMany({
      where: { status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        conversation: { select: { id: true } },
        userA: { select: { id: true, profile: { select: { displayName: true, verified: true } } } },
        userB: { select: { id: true, profile: { select: { displayName: true, verified: true } } } },
      },
      orderBy: { matchedAt: 'desc' },
    });
  }

  async unmatch(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      throw new NotFoundException('Match not found');
    }
    return this.prisma.match.update({
      where: { id: matchId },
      data: { status: 'UNMATCHED' },
    });
  }

  /** Bookmarks: profiles I favorited. */
  favorites(userId: string) {
    return this.prisma.swipe.findMany({
      where: { actorId: userId, type: 'FAVORITE' },
      include: {
        target: {
          select: {
            id: true,
            profile: {
              select: {
                displayName: true,
                city: true,
                verified: true,
                birthDate: true,
                photos: { where: { deletedAt: null }, orderBy: { position: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Sidebar badge counts. */
  async counts(userId: string) {
    const [likesReceived, matches, unreadMessages] = await Promise.all([
      this.prisma.swipe.count({
        where: { targetId: userId, type: { in: LIKE_TYPES } },
      }),
      this.prisma.match.count({
        where: { status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
      }),
      this.prisma.message.count({
        where: {
          readAt: null,
          deletedAt: null,
          senderId: { not: userId },
          conversation: {
            match: { status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
          },
        },
      }),
    ]);
    return { likesReceived, matches, unreadMessages };
  }

  /** Premium feature: see who liked you. */
  async whoLikedMe(userId: string, plan: string) {
    if (plan === 'FREE') {
      throw new ForbiddenException('Premium feature — upgrade to see who liked you');
    }
    return this.prisma.swipe.findMany({
      where: {
        targetId: userId,
        type: { in: LIKE_TYPES },
        actor: { swipesReceived: { none: { actorId: userId } } },
      },
      include: {
        actor: {
          select: { id: true, profile: { select: { displayName: true, city: true, verified: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
