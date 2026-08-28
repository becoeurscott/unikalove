import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertProfileDto {
  @ApiProperty()
  @IsString()
  @MaxLength(50)
  displayName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ type: String, format: 'date' })
  @Type(() => Date)
  @IsDate()
  birthDate: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Dating intent, e.g. serious / casual / friends' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  intent?: string;
}

export class UpdatePreferenceDto {
  @ApiPropertyOptional({ minimum: 18 })
  @IsOptional()
  @IsInt()
  @Min(18)
  minAge?: number;

  @ApiPropertyOptional({ maximum: 100 })
  @IsOptional()
  @IsInt()
  @Max(100)
  maxAge?: number;

  @ApiPropertyOptional({ maximum: 20000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20000)
  maxDistanceKm?: number;

  @ApiPropertyOptional({ enum: Gender, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  genders?: Gender[];
}

export class SetInterestsDto {
  @ApiProperty({ type: [String], description: 'Interest slugs' })
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  slugs: string[];
}

export class AddPhotoDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  url: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class SubmitVerificationDto {
  @ApiProperty()
  @IsUrl({ require_tld: false })
  selfieUrl: string;
}


/** Screen 8 — lifestyle & personality. Every field optional: saved per screen. */
export class LifestyleDto {
  @ApiPropertyOptional({ minimum: 120, maximum: 230 })
  @IsOptional()
  @IsInt()
  @Min(120)
  @Max(230)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  education?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  occupation?: string;

  @ApiPropertyOptional({ enum: ['never', 'socially', 'regularly'] })
  @IsOptional()
  @IsIn(['never', 'socially', 'regularly'])
  smoking?: string;

  @ApiPropertyOptional({ enum: ['never', 'socially', 'regularly'] })
  @IsOptional()
  @IsIn(['never', 'socially', 'regularly'])
  drinking?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  religion?: string;

  @ApiPropertyOptional({ enum: ['have', 'want', 'none'] })
  @IsOptional()
  @IsIn(['have', 'want', 'none'])
  children?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  traits?: string[];
}

/** Screen 11 — privacy controls and consent. */
export class PrivacyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showDistance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showAge?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  discoverable?: boolean;

  @ApiPropertyOptional({ description: 'Records consent to the terms.' })
  @IsOptional()
  @IsBoolean()
  acceptTerms?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  marketingOptIn?: boolean;
}

/** Partial profile save — used by each onboarding screen in turn. */
export class ProfileStepDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthDate?: Date;

  @ApiPropertyOptional({ enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  intent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 12, description: 'Onboarding progress.' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  onboardingStep?: number;
}
