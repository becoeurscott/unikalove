import { ApiProperty } from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { IsIn } from 'class-validator';

export class CheckoutDto {
  @ApiProperty({ enum: ['PREMIUM', 'PREMIUM_PLUS'] })
  @IsIn(['PREMIUM', 'PREMIUM_PLUS'])
  plan: Extract<Plan, 'PREMIUM' | 'PREMIUM_PLUS'>;
}
