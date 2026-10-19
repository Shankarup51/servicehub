import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class UpdateServiceAreaDto {
  @ApiPropertyOptional({
    example: 'Mumbai',
    description: 'Updated city of service operation',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @Length(2, 100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Bandra East',
    description: 'Updated neighborhood or locality',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @Length(2, 150)
  area?: string;

  @ApiPropertyOptional({
    example: '400051',
    description: 'Updated postal/ZIP code',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @Length(3, 10)
  @Matches(/^[a-zA-Z0-9\-\s]{3,10}$/, {
    message: 'pinCode must contain 3-10 alphanumeric characters',
  })
  pinCode?: string;
}
