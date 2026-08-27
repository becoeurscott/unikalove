import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDate,
  IsEnum,
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
