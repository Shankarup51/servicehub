import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    example: '7f9e4d...',
    description: 'Email verification token received by the user',
  })
  @IsString()
  @Length(32, 256)
  token!: string;
}