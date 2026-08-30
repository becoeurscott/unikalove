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

  /** See CheckoutDto — Chariow needs a national number plus an ISO2 country. */
  @ApiPropertyOptional({ description: 'ISO2 country of the phone, e.g. SN' })
  @IsOptional()
  @Matches(/^[A-Za-z]{2}$/, { message: 'Pays du numéro invalide (ISO2 attendu)' })
  phoneCountry?: string;

  @ApiPropertyOptional({ description: 'National number without dialling code' })
  @IsOptional()
  @Matches(/^[0-9\s.-]{6,15}$/, { message: 'Numéro local invalide' })
  phoneLocal?: string;
}
