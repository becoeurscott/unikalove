import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { AI_SERVICE, StubAiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenRouterAiService } from './openrouter-ai.service';
import { OpenRouterClient } from './openrouter.client';

@Module({
  controllers: [AiController],
  providers: [
    {
      provide: AI_SERVICE,
      inject: [ConfigService, RedisService],
      useFactory: (config: ConfigService, redis: RedisService) => {
        const apiKey = config.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) return new StubAiService();
        return new OpenRouterAiService(
          new OpenRouterClient({
            apiKey,
            model: config.get<string>('OPENROUTER_MODEL') ?? 'anthropic/claude-opus-5',
            baseUrl:
              config.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1',
            appUrl: config.get<string>('APP_URL'),
            timeoutMs: Number(config.get('AI_TIMEOUT_MS') ?? 20_000),
          }),
          redis,
        );
      },
    },
  ],
  exports: [AI_SERVICE],
})
export class AiModule {}
