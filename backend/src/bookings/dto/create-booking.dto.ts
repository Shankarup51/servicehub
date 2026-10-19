import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateBookingLocationDto } from './create-booking-location.dto.js';

export class CreateBookingDto {
  @ApiProperty({
    description: 'Identifier of the active, unexpired booking hold',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  bookingHoldId!: number;

  @ApiPropertyOptional({
    description: 'Optional note or instructions from customer to service provider',
    example: 'Please ring the back doorbell upon arrival.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  customerNote?: string;

  @ApiProperty({
    description: 'Service delivery location details',
    type: CreateBookingLocationDto,
  })
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateBookingLocationDto)
  location!: CreateBookingLocationDto;
}
