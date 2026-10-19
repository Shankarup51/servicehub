import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateProviderProfileDto {
  @ApiProperty({
    example: 'Apex Home Services',
    description: 'Public business or trade name displayed to customers',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  displayName!: string;

  @ApiPropertyOptional({
    example: 'Specializing in residential maintenance, plumbing, and deep electrical cleaning.',
    description: 'Detailed professional biography and service summary',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiProperty({
    example: 'Asia/Kolkata',
    description: 'Standard IANA timezone identifier for scheduling and availability',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  timezone!: string;
}
