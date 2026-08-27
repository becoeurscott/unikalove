import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../../redis/redis.service';
import { AI_SERVICE, StubAiService } from './ai.service';
import { AiController } from './ai.controller';
import { OpenRouterAiService } from './openrouter-ai.service';
import { OpenRouterClient } from './openrouter.client';
import { resolveModels } from './models';

@Module({
  controllers: [AiController],
  providers: [
    {
      provide: AI_SERVICE,
      inject: [ConfigService, RedisService],
      useFactory: (config: ConfigService, redis: RedisService) => {
        const apiKey = config.get<string>('OPENROUTER_API_KEY');
        if (!apiKey) return new StubAiService();
        const models = resolveModels((k) => config.get<string>(k));
        return new OpenRouterAiService(
          new OpenRouterClient({
            apiKey,
            // Fallback only: every call names its own model (see models.ts).
            model: models.coach,
            baseUrl:
              config.get<string>('OPENROUTER_BASE_URL') ?? 'https://openrouter.ai/api/v1',
            appUrl: config.get<string>('APP_URL'),
            timeoutMs: Number(config.get('AI_TIMEOUT_MS') ?? 45_000),
          }),
          redis,
          models,
          Number(config.get('AI_DAILY_BUDGET') ?? 25),
        );
      },
    },
  ],
  exports: [AI_SERVICE],
})
export class AiModule {}
