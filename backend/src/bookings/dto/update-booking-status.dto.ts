import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export const ALLOWED_STATUS_UPDATES = [
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
] as const;

export type AllowedStatusUpdate = (typeof ALLOWED_STATUS_UPDATES)[number];

export class UpdateBookingStatusDto {
  @ApiProperty({
    description: 'New booking status to transition into',
    enum: ALLOWED_STATUS_UPDATES,
    example: 'CONFIRMED',
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(ALLOWED_STATUS_UPDATES, {
    message: `Status must be one of: ${ALLOWED_STATUS_UPDATES.join(', ')}`,
  })
  status!: AllowedStatusUpdate;

  @ApiPropertyOptional({
    description: 'Optional reason or note regarding the status update',
    example: 'Service completed to client satisfaction.',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
