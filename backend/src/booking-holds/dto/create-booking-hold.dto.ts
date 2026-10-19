import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateBookingHoldDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the published catalog service to reserve',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  serviceId!: number;

  @ApiProperty({
    example: '2026-10-22T10:00:00.000Z',
    description: 'Requested booking start timestamp in ISO 8601 format',
  })
  @IsDateString(
    {},
    { message: 'startAt must be a valid ISO 8601 timestamp string' },
  )
  @IsNotEmpty()
  startAt!: string;
}
