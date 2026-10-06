import {
  IsEmail,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'uma@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'StrongPassword123!',
    description: 'User password',
    minLength: 8,
    maxLength: 128,
  })
  @IsString()
  @Length(8, 128)
  password!: string;

  @ApiProperty({
    example: 'Uma',
    description: 'User first name',
  })
  @IsString()
  @Length(1, 100)
  firstName!: string;

  @ApiPropertyOptional({
    example: 'Shankar',
    description: 'User last name',
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10,15}$/, {
    message: 'Phone must contain 10 to 15 digits',
  })
  phone?: string;
}