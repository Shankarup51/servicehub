import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, MaxLength } from 'class-validator';

export class AdminRejectVerificationDto {
  @ApiProperty({
    example:
      'The business license document submitted has expired. Please provide a valid, currently active municipal license.',
    description: 'Detailed explanation for rejection provided to the provider',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 1000)
  rejectionReason!: string;
}
