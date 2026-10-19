import {
  Body,
  Controller,
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
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import { QueryBookingsDto } from './dto/query-bookings.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@ApiTags('Bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings:create')
  @ApiOperation({
    summary: 'Create a new customer booking from an active hold',
    description:
      'Converts an active, unexpired booking hold into a confirmed/pending booking. Authoritative prices, durations, and details are snapshotted from the database. Atomically associates service delivery location, creates status history, and consumes the hold.',
  })
  @ApiResponse({
    status: 201,
    description: 'Booking created successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request: Hold is expired, inactive, or associated service/provider is no longer active',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Hold belongs to a different customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Not found: Hold or associated service not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: Hold already consumed or concurrent slot conflict detected',
  })
  createBooking(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(req.user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings:read')
  @ApiOperation({
    summary: 'List customer bookings',
    description:
      'Retrieves paginated bookings for the authenticated customer. Supports filtering by status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated customer bookings',
  })
  listBookings(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.getCustomerBookings(req.user.userId, query);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings:read')
  @ApiOperation({
    summary: 'Get customer own bookings (explicit route)',
    description:
      'Retrieves paginated bookings owned by the authenticated customer. Includes location, service, and provider summaries.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated customer bookings',
  })
  getCustomerBookings(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.getCustomerBookings(req.user.userId, query);
  }

  @Get('assigned')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings:read')
  @ApiOperation({
    summary: 'List provider assigned bookings',
    description:
      'Retrieves paginated bookings assigned to the authenticated provider. Provider identity is derived securely from the authenticated user and ProviderProfile relation.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated bookings assigned to provider',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Authenticated user is not an active provider',
  })
  getProviderBookings(
    @Req() req: AuthenticatedRequest,
    @Query() query: QueryBookingsDto,
  ) {
    return this.bookingsService.getProviderBookings(req.user.userId, query);
  }

  @Get('assigned/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings:read')
  @ApiOperation({
    summary: 'Get provider assigned booking detail',
    description:
      'Retrieves single booking details assigned to the authenticated provider. Enforces provider assignment.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Assigned booking details',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: Provider is not assigned to this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  getProviderBookingById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.getProviderBookingById(req.user.userId, id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('bookings:read')
  @ApiOperation({
    summary: 'Get booking detail by ID with ownership enforcement',
    description:
      'Retrieves full booking details. Enforces ownership: customers can only view their own bookings, assigned providers can only view their assigned bookings, and administrators can view any booking.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking details',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User is not authorized to view this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  getBookingById(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.bookingsService.getBookingById(id, req.user.userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Update booking status along the valid lifecycle',
    description:
      'Updates booking status along permitted state transitions (e.g., PENDING -> CONFIRMED, CONFIRMED -> IN_PROGRESS, IN_PROGRESS -> COMPLETED). Restricted to assigned provider or platform administrator.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request: Invalid state transition',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden: Caller is not assigned provider or administrator, or customer attempted direct status modification',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Concurrent status change detected',
  })
  updateBookingStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatus(id, req.user.userId, dto);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Cancel an active booking',
    description:
      'Cancels an existing PENDING or CONFIRMED booking. Verifies customer ownership, provider assignment, or administrator privilege. Atomically transitions status to CANCELLED, creates Cancellation record, and logs BookingStatusHistory.',
  })
  @ApiParam({ name: 'id', description: 'Booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Booking cancelled successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request: Booking is already cancelled or is in a non-cancellable state (IN_PROGRESS, COMPLETED)',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden: User is not authorized to cancel this booking',
  })
  @ApiResponse({
    status: 404,
    description: 'Booking not found',
  })
  cancelBooking(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelBookingDto,
  ) {
    return this.bookingsService.cancelBooking(id, req.user.userId, dto);
  }
}
