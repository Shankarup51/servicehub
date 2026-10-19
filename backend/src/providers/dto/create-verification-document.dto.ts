import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CreateVerificationDocumentDto {
  @ApiProperty({
    example: 'BUSINESS_LICENSE',
    description:
      'Category or classification of the document (e.g. ID_PROOF, BUSINESS_LICENSE, CERTIFICATE, ADDRESS_PROOF)',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 50)
  @Matches(/^[A-Z0-9_]{2,50}$/, {
    message: 'documentType must be uppercase alphanumeric with underscores (e.g. BUSINESS_LICENSE, ID_PROOF)',
  })
  documentType!: string;

  @ApiProperty({
    example: 'verifications/provider-1/business-license.pdf',
    description: 'Cloud/system storage key where document is stored',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @Matches(/^(?![.\/])(?!.*(?:\.\.|\/\/))[a-zA-Z0-9_\-\.\/]+$/, {
    message:
      'storageKey may only contain alphanumeric characters, hyphens, underscores, dots, and slashes, cannot start with / or ., and cannot contain path traversal sequences (..)',
  })
  storageKey!: string;

  @ApiProperty({
    example: 'business_license_2026.pdf',
    description: 'Original name of the file',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME type of the document (e.g. application/pdf, image/jpeg, image/png, image/webp)',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^(application\/pdf|image\/(jpeg|png|webp))$/i, {
    message: 'mimeType must be application/pdf, image/jpeg, image/png, or image/webp',
  })
  mimeType!: string;
}
