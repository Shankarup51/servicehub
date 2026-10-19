import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateServiceImageDto {
  @ApiProperty({
    example: 'services/service-1-img-1.webp',
    description: 'Storage key / path where image is stored',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Matches(/^(?![.\/])(?!.*(?:\.\.|\/\/))[a-zA-Z0-9_\-\.\/]+$/, {
    message:
      'storageKey may only contain alphanumeric characters, hyphens, underscores, periods, and forward slashes, cannot start with / or ., and cannot contain path traversal sequences (..)',
  })
  storageKey!: string;

  @ApiProperty({
    example: 'cleaning-living-room.webp',
    description: 'Original file name',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    example: 'image/webp',
    description: 'Image MIME type (e.g. image/jpeg, image/png, image/webp)',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/i, {
    message:
      'mimeType must be a valid image format (image/jpeg, image/png, image/webp, image/gif, image/avif, or image/svg+xml)',
  })
  mimeType!: string;

  @ApiPropertyOptional({
    example: 0,
    description:
      'Sort order index (optional; if omitted, sequentially auto-assigned)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  sortOrder?: number;

  @ApiPropertyOptional({
    example: true,
    description:
      'Whether this image should be the primary/cover image for the service',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

