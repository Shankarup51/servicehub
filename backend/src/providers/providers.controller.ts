import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ProvidersService } from './providers.service.js';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';
import { CreateServiceAreaDto } from './dto/create-service-area.dto.js';
import { UpdateServiceAreaDto } from './dto/update-service-area.dto.js';
import { CreateVerificationDocumentDto } from './dto/create-verification-document.dto.js';
import { ProviderOnboardingDto } from './dto/provider-onboarding.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Providers')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  // --------------------------------------------------------------------------
  // Provider Onboarding Orchestration Endpoints (Customer -> Provider)
  // --------------------------------------------------------------------------

  @Post('onboard')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Complete provider onboarding application',
    description:
      'Atomically coordinates the customer-to-provider onboarding flow in a transaction: creates or updates ProviderProfile, registers initial service areas, stores verification document metadata, and submits the application for administrator review (status: PENDING).',
  })
  @ApiResponse({
    status: 201,
    description: 'Provider onboarding application submitted successfully and pending review',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Missing required documents, invalid service areas, or validation failure',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Application already pending review or provider already approved',
  })
  onboard(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ProviderOnboardingDto,
  ) {
    return this.providersService.onboard(req.user.userId, dto);
  }

  @Post('apply')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Apply to become a service provider (alias to /onboard)',
    description:
      'Alias endpoint to complete provider application and submit for administrator review.',
  })
  @ApiResponse({
    status: 201,
    description: 'Provider onboarding application submitted successfully and pending review',
  })
  apply(
    @Req() req: AuthenticatedRequest,
    @Body() dto: ProviderOnboardingDto,
  ) {
    return this.providersService.onboard(req.user.userId, dto);
  }

  // --------------------------------------------------------------------------
  // Authenticated Provider Profile Endpoints
  // --------------------------------------------------------------------------

  @Post('profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Initialize provider profile',
    description:
      'Creates a new ProviderProfile for the authenticated user and initializes their verification application in DRAFT status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Provider profile initialized successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Provider profile already exists for this account',
  })
  createProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateProviderProfileDto,
  ) {
    return this.providersService.createProfile(req.user.userId, dto);
  }

  @Get('profile/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Get current user provider profile',
    description:
      'Retrieves the authenticated user’s provider profile, including service areas and latest verification status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Own provider profile retrieved',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider profile not found for authenticated user',
  })
  getOwnProfile(@Req() req: AuthenticatedRequest) {
    return this.providersService.getOwnProfile(req.user.userId);
  }

  @Patch('profile/me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Update current provider profile',
    description:
      'Updates editable fields (displayName, bio, timezone) for the authenticated provider profile. Suspended providers are rejected.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider profile updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Provider account is suspended',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider profile not found',
  })
  updateOwnProfile(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProviderProfileDto,
  ) {
    return this.providersService.updateOwnProfile(req.user.userId, dto);
  }

  // --------------------------------------------------------------------------
  // Authenticated Provider Service Areas Endpoints
  // --------------------------------------------------------------------------

  @Get('me/service-areas')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'List own service areas',
    description:
      'Retrieves all operational service areas registered for the authenticated provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of registered service areas',
  })
  getOwnServiceAreas(@Req() req: AuthenticatedRequest) {
    return this.providersService.getOwnServiceAreas(req.user.userId);
  }

  @Post('me/service-areas')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Add a new service area',
    description:
      'Registers a new operational service area (city, neighborhood, pinCode) for the authenticated provider.',
  })
  @ApiResponse({
    status: 201,
    description: 'Service area registered',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Duplicate service area for this provider',
  })
  addServiceArea(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateServiceAreaDto,
  ) {
    return this.providersService.addServiceArea(req.user.userId, dto);
  }

  @Patch('me/service-areas/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Update service area',
    description:
      'Updates an existing service area. Enforces provider ownership and prevents duplicate entries.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service area updated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Service area does not belong to provider',
  })
  @ApiResponse({
    status: 404,
    description: 'Service area not found',
  })
  updateServiceArea(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateServiceAreaDto,
  ) {
    return this.providersService.updateServiceArea(id, req.user.userId, dto);
  }

  @Delete('me/service-areas/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Delete service area',
    description:
      'Deletes a registered service area. Enforces provider ownership.',
  })
  @ApiResponse({
    status: 200,
    description: 'Service area deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Service area does not belong to provider',
  })
  deleteServiceArea(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providersService.deleteServiceArea(id, req.user.userId);
  }

  // --------------------------------------------------------------------------
  // Authenticated Provider Verification Workflow Endpoints
  // --------------------------------------------------------------------------

  @Get('me/verification')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Get verification status',
    description:
      'Retrieves the current verification application and document metadata for the authenticated provider.',
  })
  @ApiResponse({
    status: 200,
    description: 'Provider verification status details',
  })
  getOwnVerification(@Req() req: AuthenticatedRequest) {
    return this.providersService.getOwnVerification(req.user.userId);
  }

  @Post('me/verification/documents')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Add verification document metadata',
    description:
      'Registers document metadata (storageKey, fileName, mimeType, documentType). Allowed ONLY when verification is in DRAFT or REJECTED status.',
  })
  @ApiResponse({
    status: 201,
    description: 'Document metadata added',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Cannot modify documents while under review or approved',
  })
  addVerificationDocument(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateVerificationDocumentDto,
  ) {
    return this.providersService.addVerificationDocument(req.user.userId, dto);
  }

  @Delete('me/verification/documents/:documentId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Remove verification document metadata',
    description:
      'Removes a verification document. Allowed ONLY when verification is in DRAFT or REJECTED status. Enforces document ownership.',
  })
  @ApiResponse({
    status: 200,
    description: 'Document removed',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Cannot remove documents while under review or approved',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Document does not belong to provider',
  })
  deleteVerificationDocument(
    @Param('documentId', ParseIntPipe) documentId: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providersService.deleteVerificationDocument(documentId, req.user.userId);
  }

  @Post('me/verification/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiOperation({
    summary: 'Submit verification application',
    description:
      'Submits the provider verification application for administrator review (transitions from DRAFT or REJECTED to PENDING). Requires at least 1 document.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification submitted for review',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Missing documents or invalid state transition',
  })
  submitVerification(@Req() req: AuthenticatedRequest) {
    return this.providersService.submitVerification(req.user.userId);
  }

  // --------------------------------------------------------------------------
  // Public Eligible Provider Profile Endpoint
  // --------------------------------------------------------------------------

  @Get(':id')
  @ApiOperation({
    summary: 'Get eligible public provider profile',
    description:
      'Retrieves the public profile of a provider if they are ACTIVE and APPROVED. Excludes sensitive private documents and unverified services.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public provider profile',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found, suspended, or not verified',
  })
  getPublicProfile(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.getPublicProfile(id);
  }
}
