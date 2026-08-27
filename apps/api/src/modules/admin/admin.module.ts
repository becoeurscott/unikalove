import { Module } from '@nestjs/common';
import { SafetyModule } from '../safety/safety.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UsersModule, SafetyModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
