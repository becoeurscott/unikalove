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

  /**
   * Chariow wants the national number plus an ISO2 country and rejects a raw
   * E.164. African numbers can be split from the dialling code alone, but a
   * diaspora number (+33, +1) cannot — send these whenever the picker knows.
   */
  @ApiPropertyOptional({ description: 'ISO2 country of the phone, e.g. SN, CI, FR' })
  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/, { message: 'Pays du numéro invalide (ISO2 attendu, ex. SN)' })
  phoneCountry?: string;

  @ApiPropertyOptional({ description: 'National number without dialling code, e.g. 771234567' })
  @IsOptional()
  @Matches(/^[0-9\s.-]{6,15}$/, { message: 'Numéro local invalide' })
  phoneLocal?: string;
}
