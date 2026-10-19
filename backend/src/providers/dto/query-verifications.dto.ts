import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum VerificationStatusEnum {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class QueryVerificationsDto {
  @ApiPropertyOptional({
    example: 'PENDING',
    enum: VerificationStatusEnum,
    description: 'Filter applications by status',
  })
  @IsOptional()
  @IsEnum(VerificationStatusEnum)
  status?: VerificationStatusEnum;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page (maximum 100)',
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'Alex',
    description: 'Search applications by provider display name, email, or applicant name',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({
    example: 'submittedAt',
    description: 'Field to sort verifications by',
    enum: ['submittedAt', 'createdAt', 'id'],
    default: 'submittedAt',
  })
  @IsOptional()
  @IsString()
  @IsIn(['submittedAt', 'createdAt', 'id'])
  sortBy?: 'submittedAt' | 'createdAt' | 'id' = 'submittedAt';

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

