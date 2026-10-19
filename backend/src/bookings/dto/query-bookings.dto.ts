import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const ALL_BOOKING_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'PROVIDER_UNAVAILABLE',
  'REASSIGNMENT_PENDING',
  'NEW_PROVIDER_ASSIGNED',
] as const;

export class QueryBookingsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (maximum 50)',
    default: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filter bookings by status',
    enum: ALL_BOOKING_STATUSES,
  })
  @IsOptional()
  @IsString()
  @IsIn(ALL_BOOKING_STATUSES)
  status?: string;

  @ApiPropertyOptional({
    description: 'Search keyword matching booking ID, service title, or counterparty name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter bookings by scheduled timeframe relative to current time',
    enum: ['ALL', 'UPCOMING', 'PAST'],
    default: 'ALL',
  })
  @IsOptional()
  @IsString()
  @IsIn(['ALL', 'UPCOMING', 'PAST'])
  timeframe?: 'ALL' | 'UPCOMING' | 'PAST' = 'ALL';

  @ApiPropertyOptional({
    description: 'Field to sort bookings by',
    enum: ['createdAt', 'startAt', 'finalAmount', 'serviceName'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'startAt', 'finalAmount', 'serviceName'])
  sortBy?: 'createdAt' | 'startAt' | 'finalAmount' | 'serviceName' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

