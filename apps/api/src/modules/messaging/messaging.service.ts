import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { MessageType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { cursorArgs, toPage } from '../../common/pagination';
import { ModerationService } from '../safety/moderation.service';
import { PresenceService } from './presence.service';

@Injectable()
export class MessagingService {
  constructor(
    private prisma: PrismaService,
    private moderation: ModerationService,
    private presence: PresenceService,
  ) {}

  /** Throws unless the user is one of the two match members. */
  async assertMember(conversationId: string, userId: string) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { match: true },
    });
    if (!conv) throw new NotFoundException('Conversation not found');
    const { userAId, userBId, status } = conv.match;
    if (userAId !== userId && userBId !== userId) {
      throw new ForbiddenException('Not a member of this conversation');
    }
    if (status !== 'ACTIVE') throw new ForbiddenException('Match is no longer active');
    return { conv, otherUserId: userAId === userId ? userBId : userAId };
  }

  /** The other side of every active match — who should hear this user's
   *  presence changes, and whose presence this user is shown. */
  async matchPartnerIds(userId: string): Promise<string[]> {
    const matches = await this.prisma.match.findMany({
      where: { status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
      select: { userAId: true, userBId: true },
    });
    return matches.map((m) => (m.userAId === userId ? m.userBId : m.userAId));
  }

  async listConversations(userId: string) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        match: { status: 'ACTIVE', OR: [{ userAId: userId }, { userBId: userId }] },
      },
      include: {
        match: {
          include: {
            userA: { select: { id: true, profile: { select: { displayName: true } } } },
            userB: { select: { id: true, profile: { select: { displayName: true } } } },
          },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, where: { deletedAt: null } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // The list is the main place presence is read, so it ships with the rows
    // rather than making the client fan out one request per conversation.
    const partnerIds = conversations.map((c) =>
      c.match.userAId === userId ? c.match.userBId : c.match.userAId,
    );
    const statuses = await this.presence.statusFor(partnerIds);
    return conversations.map((c) => {
      const otherId = c.match.userAId === userId ? c.match.userBId : c.match.userAId;
      const status = statuses.get(otherId);
      return {
        ...c,
        otherUserId: otherId,
        online: status?.online ?? false,
        lastSeenAt: status?.lastSeenAt ?? null,
      };
    });
  }

  async listMessages(userId: string, conversationId: string, cursor?: string, limit = 30) {
    await this.assertMember(conversationId, userId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...cursorArgs(cursor),
    });
    return toPage(messages, limit);
  }

  async sendMessage(
    userId: string,
    conversationId: string,
    content: string,
    type: MessageType = 'TEXT',
  ) {
    const { otherUserId } = await this.assertMember(conversationId, userId);
    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content, type },
    });
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
    // Non-blocking AI safety review; flagged text files an admin report.
    if (type === 'TEXT') this.moderation.review(userId, content, 'message');
    return { message, otherUserId };
  }

  async markRead(userId: string, conversationId: string) {
    const { otherUserId } = await this.assertMember(conversationId, userId);
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
    return { otherUserId };
  }

  async react(userId: string, messageId: string, emoji: string) {
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found');
    const { otherUserId } = await this.assertMember(message.conversationId, userId);
    const reactions = { ...((message.reactions as Record<string, string>) ?? {}), [userId]: emoji };
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { reactions },
    });
    return { message: updated, otherUserId };
  }
}
