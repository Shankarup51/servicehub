import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateServiceAreaDto {
  @ApiProperty({
    example: 'Mumbai',
    description: 'City of service operation',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  city!: string;

  @ApiProperty({
    example: 'Bandra West',
    description: 'Neighborhood, locality, or district',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  area!: string;

  @ApiProperty({
    example: '400050',
    description: 'Postal/ZIP code',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9\-\s]{3,10}$/, {
    message: 'pinCode must contain 3-10 alphanumeric characters',
  })
  pinCode!: string;
}
