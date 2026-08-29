import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageType } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { PresenceService } from './presence.service';

interface AuthedSocket extends Socket {
  data: { userId: string };
}

@WebSocketGateway({ namespace: '/rt', cors: { origin: true, credentials: true } })
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer() server: Server;
  private logger = new Logger('MessagingGateway');
  private heartbeat?: NodeJS.Timeout;

  constructor(
    private jwt: JwtService,
    private messaging: MessagingService,
    private presence: PresenceService,
  ) {}

  /** Refreshes the Redis presence mirror for users who are connected but idle;
   *  without it their key would lapse and they would appear to go offline. */
  onModuleInit() {
    this.heartbeat = setInterval(() => void this.presence.heartbeat(), 30_000);
  }

  onModuleDestroy() {
    if (this.heartbeat) clearInterval(this.heartbeat);
  }

  /** Tells this user's matches that their status changed, and — on connect —
   *  tells the arriving user which of their matches are already online. */
  private async broadcastPresence(userId: string, online: boolean) {
    const partners = await this.messaging.matchPartnerIds(userId);
    const payload = { userId, online, lastSeenAt: online ? null : new Date().toISOString() };
    for (const partnerId of partners) {
      this.server.to(`user:${partnerId}`).emit('presence', payload);
    }
    return partners;
  }

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        (client.handshake.headers.authorization ?? '').replace('Bearer ', '');
      const payload = await this.jwt.verifyAsync(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      const becameOnline = await this.presence.connect(payload.sub);
      const partners = becameOnline
        ? await this.broadcastPresence(payload.sub, true)
        : await this.messaging.matchPartnerIds(payload.sub);

      // Seed the arriving client so it does not have to wait for someone else
      // to change state before its badges are correct.
      const statuses = await this.presence.statusFor(partners);
      client.emit(
        'presence.sync',
        [...statuses.entries()].map(([id, s]) => ({
          userId: id,
          online: s.online,
          lastSeenAt: s.lastSeenAt?.toISOString() ?? null,
        })),
      );
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: AuthedSocket) {
    const userId = client.data?.userId;
    this.logger.debug(`disconnected ${userId ?? 'anon'}`);
    if (!userId) return;
    if (await this.presence.disconnect(userId)) {
      await this.broadcastPresence(userId, false);
    }
  }

  @SubscribeMessage('conversation.join')
  async joinConversation(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    await this.messaging.assertMember(body.conversationId, client.data.userId);
    client.join(`conv:${body.conversationId}`);
    return { joined: body.conversationId };
  }

  @SubscribeMessage('message.send')
  async sendMessage(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string; content: string; type?: MessageType },
  ) {
    const { message, otherUserId } = await this.messaging.sendMessage(
      client.data.userId,
      body.conversationId,
      body.content,
      body.type ?? 'TEXT',
    );
    this.server.to(`conv:${body.conversationId}`).to(`user:${otherUserId}`).emit('message.new', message);
    return message;
  }

  @SubscribeMessage('typing')
  async typing(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string; isTyping: boolean },
  ) {
    const { otherUserId } = await this.messaging.assertMember(
      body.conversationId,
      client.data.userId,
    );
    this.server.to(`user:${otherUserId}`).emit('typing', {
      conversationId: body.conversationId,
      userId: client.data.userId,
      isTyping: body.isTyping,
    });
  }

  @SubscribeMessage('read')
  async read(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { conversationId: string },
  ) {
    const { otherUserId } = await this.messaging.markRead(
      client.data.userId,
      body.conversationId,
    );
    this.server.to(`user:${otherUserId}`).emit('read', {
      conversationId: body.conversationId,
      byUserId: client.data.userId,
    });
  }

  @SubscribeMessage('reaction')
  async reaction(
    @ConnectedSocket() client: AuthedSocket,
    @MessageBody() body: { messageId: string; emoji: string },
  ) {
    const { message, otherUserId } = await this.messaging.react(
      client.data.userId,
      body.messageId,
      body.emoji,
    );
    this.server.to(`user:${otherUserId}`).emit('reaction', message);
    return message;
  }
}
