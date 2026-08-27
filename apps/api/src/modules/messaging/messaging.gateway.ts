import { Logger, UnauthorizedException } from '@nestjs/common';
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

interface AuthedSocket extends Socket {
  data: { userId: string };
}

@WebSocketGateway({ namespace: '/rt', cors: { origin: true, credentials: true } })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger = new Logger('MessagingGateway');

  constructor(
    private jwt: JwtService,
    private messaging: MessagingService,
  ) {}

  async handleConnection(client: AuthedSocket) {
    try {
      const token =
        client.handshake.auth?.token ??
        (client.handshake.headers.authorization ?? '').replace('Bearer ', '');
      const payload = await this.jwt.verifyAsync(token);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthedSocket) {
    this.logger.debug(`disconnected ${client.data?.userId ?? 'anon'}`);
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
