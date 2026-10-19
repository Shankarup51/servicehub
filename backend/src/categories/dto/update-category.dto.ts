import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Deep Cleaning',
    description: 'Updated category name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string;

  @ApiPropertyOptional({
    example: 'Specialized deep cleaning and sanitation services',
    description: 'Updated description of the category',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Updated parent category ID, or null to make it a root category',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_obj, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number | null;

  @ApiPropertyOptional({
    example: true,
    description: 'Toggle category active status',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
