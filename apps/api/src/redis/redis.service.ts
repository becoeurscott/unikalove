import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/**
 * Thin Redis wrapper for caches, counters and budgets. Every method degrades to
 * a no-op when Redis is unreachable so a cache outage never breaks a request.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    if (!url) {
      this.logger.warn('REDIS_URL not set — caching and AI budgets disabled');
      return;
    }
    this.client = new Redis(url, {
      maxRetriesPerRequest: 1,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    });
    this.client.on('error', (err) => this.logger.warn(`Redis: ${err.message}`));
  }

  async get(key: string): Promise<string | null> {
    try {
      return (await this.client?.get(key)) ?? null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) await this.client?.set(key, value, 'EX', ttlSeconds);
      else await this.client?.set(key, value);
    } catch {
      /* cache write is best-effort */
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  /** Increment a counter that expires after `ttlSeconds`; returns the new value. */
  async incr(key: string, ttlSeconds: number): Promise<number> {
    try {
      if (!this.client) return 0;
      const value = await this.client.incr(key);
      if (value === 1) await this.client.expire(key, ttlSeconds);
      return value;
    } catch {
      return 0; // fail open — never block a feature because Redis is down
    }
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined);
  }
}
