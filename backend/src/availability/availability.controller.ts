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
import { AvailabilityService } from './availability.service.js';
import { CreateAvailabilityDto } from './dto/create-availability.dto.js';
import { QueryPublicAvailabilityDto } from './dto/query-public-availability.dto.js';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto.js';
import { UpdateBlockedSlotDto } from './dto/update-blocked-slot.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Availability & Blocked Slots')
@Controller('providers')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // --------------------------------------------------------------------------
  // Provider Weekly Availability Endpoints
  // --------------------------------------------------------------------------

  @Get('me/availability')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:read')
  @ApiOperation({
    summary: 'Get authenticated provider weekly availability schedule',
    description:
      'Retrieves the authenticated provider’s recurring weekly working schedules, ordered Monday through Sunday.',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly availability schedule list',
  })
  getOwnAvailability(@Req() req: AuthenticatedRequest) {
    return this.availabilityService.getOwnAvailability(req.user.userId);
  }

  @Post('me/availability')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:manage')
  @ApiOperation({
    summary: 'Add or update weekly availability schedule',
    description:
      'Creates a weekly availability window for a dayOfWeek. Enforces endTime > startTime and prevents overlapping windows.',
  })
  @ApiResponse({
    status: 201,
    description: 'Availability schedule created',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Invalid time range or format',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Schedule overlaps with existing window for this weekday',
  })
  addAvailability(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.addAvailability(req.user.userId, dto);
  }

  @Delete('me/availability/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:manage')
  @ApiOperation({
    summary: 'Delete weekly availability schedule',
    description:
      'Removes an existing weekly availability window. Enforces provider ownership.',
  })
  @ApiResponse({
    status: 200,
    description: 'Availability schedule deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Schedule does not belong to provider',
  })
  @ApiResponse({
    status: 404,
    description: 'Schedule not found',
  })
  deleteAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.availabilityService.deleteAvailability(id, req.user.userId);
  }

  // --------------------------------------------------------------------------
  // Provider Blocked Slots Endpoints
  // --------------------------------------------------------------------------

  @Get('me/blocked-slots')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:read')
  @ApiOperation({
    summary: 'List authenticated provider blocked slots',
    description:
      'Retrieves all unavailable blocked periods registered by the authenticated provider, including reasons.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of blocked slots',
  })
  getOwnBlockedSlots(@Req() req: AuthenticatedRequest) {
    return this.availabilityService.getOwnBlockedSlots(req.user.userId);
  }

  @Post('me/blocked-slots')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:manage')
  @ApiOperation({
    summary: 'Create a blocked time range',
    description:
      'Blocks out a time range for holidays, breaks, or maintenance. Validates against existing confirmed bookings to prevent invalidation.',
  })
  @ApiResponse({
    status: 201,
    description: 'Blocked slot created',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Invalid timestamps or endAt <= startAt',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: Overlaps with an existing confirmed booking or blocked slot',
  })
  createBlockedSlot(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBlockedSlotDto,
  ) {
    return this.availabilityService.createBlockedSlot(req.user.userId, dto);
  }

  @Patch('me/blocked-slots/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:manage')
  @ApiOperation({
    summary: 'Update blocked slot',
    description:
      'Modifies an existing blocked period. Validates against active bookings and existing blocked slots.',
  })
  @ApiResponse({
    status: 200,
    description: 'Blocked slot updated',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Blocked slot does not belong to provider',
  })
  @ApiResponse({
    status: 404,
    description: 'Blocked slot not found',
  })
  updateBlockedSlot(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateBlockedSlotDto,
  ) {
    return this.availabilityService.updateBlockedSlot(id, req.user.userId, dto);
  }

  @Delete('me/blocked-slots/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('providers:manage')
  @ApiOperation({
    summary: 'Delete blocked slot',
    description:
      'Removes a blocked period. Enforces provider ownership.',
  })
  @ApiResponse({
    status: 200,
    description: 'Blocked slot deleted',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Blocked slot does not belong to provider',
  })
  deleteBlockedSlot(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.availabilityService.deleteBlockedSlot(id, req.user.userId);
  }

  // --------------------------------------------------------------------------
  // Public Provider Availability Endpoint
  // --------------------------------------------------------------------------

  @Get(':id/availability')
  @ApiOperation({
    summary: 'Get public provider availability and bookable slots',
    description:
      'Calculates available bookable time slots for an active, verified provider across a date or date range (max 14 days). Excludes blocked slots, confirmed bookings, and active holds without leaking sensitive details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculated availability slots by date',
  })
  @ApiResponse({
    status: 404,
    description: 'Provider not found, suspended, unverified, or has no active services',
  })
  getPublicAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryPublicAvailabilityDto,
  ) {
    return this.availabilityService.getPublicAvailability(id, query);
  }
}
