import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateServiceImageDto } from './create-service-image.dto.js';

export enum ServiceStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateServiceDto {
  @ApiProperty({
    example: 'Deep Clean 2BHK',
    description: 'Service title/name (unique per provider)',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  name!: string;

  @ApiProperty({
    example:
      'Comprehensive deep cleaning covering kitchen, bathrooms, bedrooms, and living room.',
    description: 'Detailed description of the service offered',
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;

  @ApiProperty({
    example: 1999.0,
    description: 'Service price (must be positive, maximum 99999999.99)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  @Max(99999999.99)
  price!: number;

  @ApiProperty({
    example: 180,
    description:
      'Estimated service duration in minutes (must be positive integer, maximum 10080)',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(10080)
  durationMinutes!: number;

  @ApiProperty({
    example: 1,
    description: 'Category ID the service belongs to',
  })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoryId!: number;

  @ApiPropertyOptional({
    example: 'ACTIVE',
    enum: ServiceStatusEnum,
    description: 'Service status (ACTIVE or INACTIVE)',
    default: 'ACTIVE',
  })
  @IsOptional()
  @IsEnum(ServiceStatusEnum)
  status?: ServiceStatusEnum = ServiceStatusEnum.ACTIVE;

  @ApiPropertyOptional({
    type: () => [CreateServiceImageDto],
    description: 'Optional gallery images to register upon service creation',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateServiceImageDto)
  images?: CreateServiceImageDto[];
}


