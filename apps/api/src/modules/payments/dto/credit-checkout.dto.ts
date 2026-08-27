import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { CREDIT_SKU_KEYS } from '../pricing';

export class CreditCheckoutDto {
  @ApiProperty({ enum: CREDIT_SKU_KEYS })
  @IsIn(CREDIT_SKU_KEYS)
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ enum: ['XOF', 'XAF'], default: 'XOF' })
  @IsOptional()
  @IsIn(['XOF', 'XAF'])
  currency?: string;

  @ApiPropertyOptional({ description: 'E.164 mobile-money number' })
  @IsOptional()
  @Matches(/^\+[1-9]\d{7,14}$/, { message: 'Numéro invalide' })
  phone?: string;
}
