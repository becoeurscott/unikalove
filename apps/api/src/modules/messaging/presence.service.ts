import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

/** A user is considered online while a key with this TTL survives. */
const TTL_SECONDS = 70;
const key = (userId: string) => `presence:${userId}`;

/**
 * Who is currently connected to the realtime gateway.
 *
 * Sockets are counted per user rather than stored as a boolean: one person with
 * the app open in two tabs must not go offline when they close one of them.
 *
 * The count lives in this process, which is the authority for the single
 * instance we run today. It is mirrored into Redis with a TTL so that a second
 * instance would still see the right answer, and so a crashed process expires
 * on its own instead of leaving everyone permanently "online".
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly sockets = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /** Returns true only on the transition offline -> online, so the gateway
   *  broadcasts once per user rather than once per tab. */
  async connect(userId: string): Promise<boolean> {
    const next = (this.sockets.get(userId) ?? 0) + 1;
    this.sockets.set(userId, next);
    await this.redis.set(key(userId), '1', TTL_SECONDS);
    return next === 1;
  }

  /** Returns true only on the transition online -> offline. */
  async disconnect(userId: string): Promise<boolean> {
    const next = (this.sockets.get(userId) ?? 1) - 1;
    if (next > 0) {
      this.sockets.set(userId, next);
      return false;
    }
    this.sockets.delete(userId);
    // Let the mirror lapse rather than deleting it, so a brief reconnect (a
    // page navigation) does not flicker the badge for everyone watching.
    await this.touchLastSeen(userId);
    return true;
  }

  /** Keeps the Redis mirror alive for users who sit idle in a conversation. */
  async heartbeat(): Promise<void> {
    for (const userId of this.sockets.keys()) {
      await this.redis.set(key(userId), '1', TTL_SECONDS);
    }
  }

  isOnline(userId: string): boolean {
    return this.sockets.has(userId);
  }

  /** Presence for a set of users, shaped for the REST payloads. */
  async statusFor(
    userIds: string[],
  ): Promise<Map<string, { online: boolean; lastSeenAt: Date | null }>> {
    const unique = [...new Set(userIds)];
    const offline = unique.filter((id) => !this.isOnline(id));
    const seen = offline.length
      ? await this.prisma.user.findMany({
          where: { id: { in: offline } },
          select: { id: true, lastSeenAt: true },
        })
      : [];
    const lastSeen = new Map(seen.map((u) => [u.id, u.lastSeenAt]));
    return new Map(
      unique.map((id) => [
        id,
        { online: this.isOnline(id), lastSeenAt: lastSeen.get(id) ?? null },
      ]),
    );
  }

  private async touchLastSeen(userId: string) {
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      });
    } catch (err) {
      // A disconnect must never throw — the socket is already gone.
      this.logger.warn(`lastSeen update failed for ${userId}: ${(err as Error).message}`);
    }
  }
}
