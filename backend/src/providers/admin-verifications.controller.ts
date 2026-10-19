import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
import { AdminRejectVerificationDto } from './dto/admin-reject-verification.dto.js';
import { QueryVerificationsDto } from './dto/query-verifications.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Admin Verifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['admin/verifications', 'providers/admin/verifications'])
export class AdminVerificationsController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  @Permissions('providers:verify')
  @ApiOperation({
    summary: 'List provider verification applications (Admin only)',
    description:
      'Filter verification applications by status with pagination. Requires providers:verify permission.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated verification applications list',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Insufficient permissions',
  })
  findAll(@Query() query: QueryVerificationsDto) {
    return this.providersService.adminListVerifications(query);
  }

  @Get(':id')
  @Permissions('providers:verify')
  @ApiOperation({
    summary: 'Get verification application details by ID (Admin only)',
    description:
      'Retrieve full verification application including applicant user details and submitted document metadata.',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification application details',
  })
  @ApiResponse({
    status: 404,
    description: 'Verification application not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.providersService.adminGetVerification(id);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Permissions('providers:verify')
  @ApiOperation({
    summary: 'Approve provider verification application (Admin only)',
    description:
      'Transitions application from PENDING to APPROVED. Stamps reviewer ID and timestamp. Prevents self-approval by provider-admins.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application approved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition (application is not in PENDING status)',
  })
  @ApiResponse({
    status: 403,
    description: 'Conflict of interest: Cannot approve own provider application',
  })
  approve(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.providersService.adminApproveVerification(id, req.user.userId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Permissions('providers:verify')
  @ApiOperation({
    summary: 'Reject provider verification application (Admin only)',
    description:
      'Transitions application from PENDING to REJECTED with mandatory rejection reason. Stamps reviewer ID and timestamp.',
  })
  @ApiResponse({
    status: 200,
    description: 'Application rejected with reason',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid transition or missing rejection reason',
  })
  @ApiResponse({
    status: 403,
    description: 'Conflict of interest: Cannot review own provider application',
  })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AdminRejectVerificationDto,
  ) {
    return this.providersService.adminRejectVerification(id, req.user.userId, dto);
  }
}
