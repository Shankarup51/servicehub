import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateBlockedSlotDto {
  @ApiProperty({
    example: '2026-10-22T13:00:00.000Z',
    description: 'Start timestamp of the blocked period in ISO 8601 format',
  })
  @IsDateString(
    {},
    { message: 'startAt must be a valid ISO 8601 timestamp string' },
  )
  @IsNotEmpty()
  startAt!: string;

  @ApiProperty({
    example: '2026-10-22T15:00:00.000Z',
    description: 'End timestamp of the blocked period in ISO 8601 format (must be after startAt)',
  })
  @IsDateString(
    {},
    { message: 'endAt must be a valid ISO 8601 timestamp string' },
  )
  @IsNotEmpty()
  endAt!: string;

  @ApiProperty({
    example: 'Equipment maintenance and technician break',
    description: 'Internal reason for blocking the time slot (not exposed publicly)',
    minLength: 2,
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 500)
  reason!: string;
}
