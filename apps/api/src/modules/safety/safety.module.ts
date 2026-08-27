import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ModerationService } from './moderation.service';
import { SafetyController } from './safety.controller';
import { SafetyService } from './safety.service';

@Module({
  imports: [AiModule],
  controllers: [SafetyController],
  providers: [SafetyService, ModerationService],
  exports: [SafetyService, ModerationService],
})
export class SafetyModule {}
