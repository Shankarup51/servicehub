import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class QueryPublicAvailabilityDto {
  @ApiPropertyOptional({
    example: '2026-10-20',
    description: 'Specific date for availability lookup (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date must be in YYYY-MM-DD format (e.g. 2026-10-20)',
  })
  date?: string;

  @ApiPropertyOptional({
    example: '2026-10-20',
    description: 'Start date for date range availability query (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in YYYY-MM-DD format (e.g. 2026-10-20)',
  })
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-10-27',
    description: 'End date for date range availability query (YYYY-MM-DD, max 14 days from startDate)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in YYYY-MM-DD format (e.g. 2026-10-27)',
  })
  endDate?: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Optional service ID to generate discrete bookable slots matching service duration',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  serviceId?: number;
}
