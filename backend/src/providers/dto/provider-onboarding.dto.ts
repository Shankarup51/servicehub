import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateServiceAreaDto } from './create-service-area.dto.js';
import { CreateVerificationDocumentDto } from './create-verification-document.dto.js';

export class ProviderOnboardingDto {
  @ApiProperty({
    example: 'Elite Home Solutions',
    description: 'Provider professional or business display name',
    maxLength: 150,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  displayName!: string;

  @ApiPropertyOptional({
    example: 'Licensed master electrician and plumbing contractor with 12+ years experience.',
    description: 'Professional summary or company profile overview',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiPropertyOptional({
    example: 'Asia/Kolkata',
    description: 'Operating timezone (IANA timezone name)',
    default: 'Asia/Kolkata',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timezone?: string = 'Asia/Kolkata';

  @ApiProperty({
    type: () => [CreateServiceAreaDto],
    description: 'Initial operational service areas covered by the provider (at least 1 required)',
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one operational service area must be specified' })
  @ValidateNested({ each: true })
  @Type(() => CreateServiceAreaDto)
  serviceAreas!: CreateServiceAreaDto[];

  @ApiProperty({
    type: () => [CreateVerificationDocumentDto],
    description:
      'Verification documents metadata (at least 1 required, e.g. ID_PROOF, BUSINESS_LICENSE)',
  })
  @IsArray()
  @ArrayMinSize(1, {
    message: 'At least one verification document is required to submit your provider application',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateVerificationDocumentDto)
  documents!: CreateVerificationDocumentDto[];
}
