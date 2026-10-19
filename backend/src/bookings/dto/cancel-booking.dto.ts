import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    description: 'Concise reason code or headline for the cancellation',
    example: 'CUSTOMER_SCHEDULE_CONFLICT',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  reason!: string;

  @ApiPropertyOptional({
    description: 'Detailed explanation or context for why the booking was cancelled',
    example: 'Customer had an unexpected emergency and requested cancellation.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  explanation?: string;
}
