import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
import { BookingHoldsService } from './booking-holds.service.js';
import { CreateBookingHoldDto } from './dto/create-booking-hold.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Booking Holds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('booking-holds')
export class BookingHoldsController {
  constructor(private readonly bookingHoldsService: BookingHoldsService) {}

  @Post()
  @Permissions('bookings:create')
  @ApiOperation({
    summary: 'Create a temporary booking hold',
    description:
      'Temporarily reserves a time slot for a published service. Concurrency-safe against double bookings. Holds expire after 15 minutes if not completed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking hold created successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request: Service inactive, provider unapproved, or slot outside working hours',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: Slot is already booked, blocked, or held by another customer',
  })
  createHold(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookingHoldDto,
  ) {
    return this.bookingHoldsService.createHold(req.user.userId, dto);
  }

  @Get('me')
  @Permissions('bookings:read')
  @ApiOperation({
    summary: 'Get customer active booking hold',
    description:
      'Retrieves the currently active unexpired booking hold for the authenticated customer, or null if none active.',
  })
  @ApiResponse({
    status: 200,
    description: 'Active booking hold details or null',
  })
  getCustomerActiveHold(@Req() req: AuthenticatedRequest) {
    return this.bookingHoldsService.getCustomerActiveHold(req.user.userId);
  }

  @Delete(':id')
  @Permissions('bookings:cancel')
  @ApiOperation({
    summary: 'Release / cancel a booking hold',
    description:
      'Releases an active booking hold owned by the authenticated customer so the slot becomes immediately available to others.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking hold released',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Hold does not belong to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Hold not found',
  })
  releaseHold(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingHoldsService.releaseHold(id, req.user.userId);
  }

  @Post(':id/release')
  @HttpCode(HttpStatus.OK)
  @Permissions('bookings:cancel')
  @ApiOperation({
    summary: 'Release a booking hold (POST alias)',
    description:
      'Alternative POST action to release an active booking hold owned by the authenticated customer.',
  })
  @ApiResponse({
    status: 200,
    description: 'Booking hold released',
  })
  releaseHoldPost(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bookingHoldsService.releaseHold(id, req.user.userId);
  }
}
