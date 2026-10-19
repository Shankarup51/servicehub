import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBookingLocationDto {
  @ApiPropertyOptional({
    description: 'Address label or name (e.g. Home, Office)',
    example: 'Home',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;

  @ApiProperty({
    description: 'Street address where service is to be delivered',
    example: '123 Main Street, Apt 4B',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @ApiProperty({
    description: 'City of the service location',
    example: 'Metropolis',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({
    description: 'Area or locality of the service location',
    example: 'Downtown',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  area!: string;

  @ApiProperty({
    description: 'Postal/PIN code of the service location',
    example: '10001',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  pinCode!: string;
}
