import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class UpdateBlockedSlotDto {
  @ApiPropertyOptional({
    example: '2026-10-22T13:30:00.000Z',
    description: 'Updated start timestamp of the blocked period',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'startAt must be a valid ISO 8601 timestamp string' },
  )
  startAt?: string;

  @ApiPropertyOptional({
    example: '2026-10-22T15:30:00.000Z',
    description: 'Updated end timestamp of the blocked period',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'endAt must be a valid ISO 8601 timestamp string' },
  )
  endAt?: string;

  @ApiPropertyOptional({
    example: 'Extended equipment maintenance and calibration',
    description: 'Updated reason for blocking the time slot',
    minLength: 2,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(2, 500)
  reason?: string;
}
