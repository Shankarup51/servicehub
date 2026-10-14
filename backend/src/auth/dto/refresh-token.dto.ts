import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: '7262314a7c6410d1dffe0c9c5b7e80988f82655a1343a30d946e19ccc3bf5070',
    description: 'Current refresh token issued by the login API',
  })
  @IsString()
  @Length(64, 64)
  @Matches(/^[a-fA-F0-9]{64}$/)
  refreshToken!: string;
}