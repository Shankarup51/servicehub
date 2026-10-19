import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class UpdateProviderProfileDto {
  @ApiPropertyOptional({
    example: 'Apex Home & Commercial Services',
    description: 'Updated display name',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  displayName?: string;

  @ApiPropertyOptional({
    example: 'Updated professional bio with expanded coverage details.',
    description: 'Updated professional bio',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({
    example: 'UTC',
    description: 'Updated provider timezone',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  timezone?: string;
}
