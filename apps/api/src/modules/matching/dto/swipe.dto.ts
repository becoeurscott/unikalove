import { ApiProperty } from '@nestjs/swagger';
import { SwipeType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class SwipeDto {
  @ApiProperty()
  @IsUUID()
  targetId: string;

  @ApiProperty({ enum: SwipeType })
  @IsEnum(SwipeType)
  type: SwipeType;
}
