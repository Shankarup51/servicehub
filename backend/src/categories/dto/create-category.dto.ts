import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Home Cleaning',
    description: 'Category name (must be unique among root categories or under the same parent)',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @ApiPropertyOptional({
    example: 'Professional residential and commercial cleaning services',
    description: 'Detailed description of the category',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Optional parent category ID for nested subcategories',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the category is active and visible in the public catalog',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
