import { Module } from '@nestjs/common';
import { MessagingModule } from '../messaging/messaging.module';
import { SafetyModule } from '../safety/safety.module';
import { ProfilesController } from './profiles.controller';
import { ProfilesService } from './profiles.service';

@Module({
  imports: [SafetyModule, MessagingModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
