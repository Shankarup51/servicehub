import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  MaxLength,
} from 'class-validator';
import { ServiceStatusEnum } from './create-service.dto.js';

export class UpdateServiceDto {
  @ApiPropertyOptional({
    example: 'Deep Clean 3BHK',
    description: 'Updated service title/name',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated comprehensive deep cleaning details.',
    description: 'Updated description of the service',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({
    example: 2499.0,
    description: 'Updated service price (must be positive, maximum 99999999.99)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(99999999.99)
  price?: number;

  @ApiPropertyOptional({
    example: 240,
    description: 'Updated duration in minutes (maximum 10080)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(10080)
  durationMinutes?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Updated category ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId?: number;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ServiceStatusEnum,
    description: 'Updated service status',
  })
  @IsOptional()
  @IsEnum(ServiceStatusEnum)
  status?: ServiceStatusEnum;
}

