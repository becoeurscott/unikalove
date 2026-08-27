import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Plan } from '@prisma/client';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { PLAN_PERIODS } from '../pricing';

/**
 * Every field must be declared: the global ValidationPipe runs with
 * forbidNonWhitelisted, so an undeclared property is a 400.
 */
export class CheckoutDto {
  @ApiProperty({ enum: ['PREMIUM', 'PREMIUM_PLUS'] })
  @IsIn(['PREMIUM', 'PREMIUM_PLUS'])
  plan: Extract<Plan, 'PREMIUM' | 'PREMIUM_PLUS'>;

  @ApiPropertyOptional({ description: 'Omit to auto-select by currency.' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ enum: ['XOF', 'XAF', 'EUR', 'USD'], default: 'XOF' })
  @IsOptional()
  @IsIn(['XOF', 'XAF', 'EUR', 'USD'])
  currency?: string;

  @ApiPropertyOptional({
    enum: PLAN_PERIODS,
    description: 'Entitlement window for one-shot providers. Ignored by Stripe.',
  })
  @IsOptional()
  @IsIn(PLAN_PERIODS as unknown as number[])
  periodDays?: number;

  @ApiPropertyOptional({ description: 'E.164 mobile-money number, e.g. +221771234567' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Numéro invalide (format attendu : +221771234567)' })
  phone?: string;
}
