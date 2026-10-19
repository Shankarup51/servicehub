import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';

export enum DayOfWeekEnum {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class CreateAvailabilityDto {
  @ApiProperty({
    example: 'MONDAY',
    enum: DayOfWeekEnum,
    description: 'Day of the week for this working schedule',
  })
  @IsEnum(DayOfWeekEnum, {
    message: 'dayOfWeek must be one of: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY',
  })
  @IsNotEmpty()
  dayOfWeek!: DayOfWeekEnum;

  @ApiProperty({
    example: '09:00',
    description: 'Schedule start time in 24-hour format (HH:mm or HH:mm:ss)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'startTime must be a valid 24-hour time format (HH:mm or HH:mm:ss, e.g. 09:00)',
  })
  startTime!: string;

  @ApiProperty({
    example: '17:00',
    description: 'Schedule end time in 24-hour format (HH:mm or HH:mm:ss)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'endTime must be a valid 24-hour time format (HH:mm or HH:mm:ss, e.g. 17:00)',
  })
  endTime!: string;
}
