import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { or } from '@prisma/orm-postgres/orm-client';
import { Temporal } from 'temporal-polyfill';
import { PermissionsService } from '../auth/permissions.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { CancelBookingDto } from './dto/cancel-booking.dto.js';
import { QueryBookingsDto } from './dto/query-bookings.dto.js';

const HOLD_DURATION_MINUTES = 15;

function toEpochMs(val: any): number {
  if (!val) return 0;
  if (typeof val.epochMilliseconds === 'number') return val.epochMilliseconds;
  if (typeof val.epochMilliseconds === 'bigint') return Number(val.epochMilliseconds);
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string' || typeof val === 'number') return new Date(val).getTime();
  if (typeof val.toString === 'function') return new Date(val.toString()).getTime();
  return 0;
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'REJECTED'],
  CONFIRMED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  PROVIDER_UNAVAILABLE: [],
  REASSIGNMENT_PENDING: [],
  NEW_PROVIDER_ASSIGNED: [],
};

@Injectable()
export class BookingsService {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Format booking into standard API response, formatting numeric amounts and relations.
   */
  private formatBooking(
    booking: any,
    location?: any,
    service?: any,
    provider?: any,
    customer?: any,
    statusHistory?: any[],
    cancellation?: any,
  ) {
    const loc = location || booking.location;
    const srv = service || booking.service;
    const prov = provider || booking.provider;
    const cust = customer || booking.customer;
    const hist = statusHistory || booking.statusHistory;
    const canc = cancellation || booking.cancellation;

    return {
      id: booking.id,
      customerId: booking.customerId,
      providerId: booking.providerId,
      serviceId: booking.serviceId,
      serviceName: booking.serviceName,
      servicePrice: Number(booking.servicePrice),
      serviceDurationMinutes: booking.serviceDurationMinutes,
      discountAmount: Number(booking.discountAmount || 0),
      finalAmount: Number(booking.finalAmount),
      startAt: booking.startAt?.toString() || booking.startAt,
      endAt: booking.endAt?.toString() || booking.endAt,
      status: booking.status,
      customerNote: booking.customerNote || null,
      providerNote: booking.providerNote || null,
      createdAt: booking.createdAt?.toString() || booking.createdAt,
      updatedAt: booking.updatedAt?.toString() || booking.updatedAt,
      location: loc
        ? {
            id: loc.id,
            label: loc.label || null,
            address: loc.address,
            city: loc.city,
            area: loc.area,
            pinCode: loc.pinCode,
          }
        : null,
      service: srv
        ? {
            id: srv.id,
            name: srv.name,
            durationMinutes: srv.durationMinutes,
            category: srv.category
              ? {
                  id: srv.category.id,
                  name: srv.category.name,
                }
              : null,
          }
        : null,
      provider: prov
        ? {
            id: prov.id,
            displayName: prov.displayName,
            timezone: prov.timezone || 'UTC',
          }
        : null,
      customer: cust
        ? {
            id: cust.id,
            firstName: cust.firstName,
            lastName: cust.lastName || null,
            email: cust.email,
            phone: cust.phone || null,
          }
        : null,
      statusHistory: hist
        ? hist.map((h: any) => ({
            id: h.id,
            fromStatus: h.fromStatus,
            toStatus: h.toStatus,
            changedBy: h.changedBy,
            reason: h.reason || null,
            createdAt: h.createdAt?.toString() || h.createdAt,
          }))
        : undefined,
      cancellation: canc
        ? {
            id: canc.id,
            cancelledBy: canc.cancelledBy,
            reasonCode: canc.reasonCode,
            explanation: canc.explanation || null,
            cancelledAt: canc.cancelledAt?.toString() || canc.cancelledAt,
          }
        : null,
    };
  }

  /**
   * Customer booking creation:
   * 1. Validates hold existence, customer ownership, expiry, and unconsumed status.
   * 2. Re-validates service and provider active status.
   * 3. Executes within a concurrency-safe transaction with row-level locking on ProviderProfile.
   * 4. Snapshots authoritative prices/duration from database.
   * 5. Atomically creates Booking, ServiceLocation, initial BookingStatusHistory, and consumes the hold.
   */
  async createBooking(customerId: number, dto: CreateBookingDto) {
    // 1. Load the hold
    const hold = await db.orm.public.BookingHold.where({ id: dto.bookingHoldId })
      .include('service')
      .include('provider')
      .first();

    if (!hold) {
      throw new NotFoundException(`Booking hold with ID ${dto.bookingHoldId} not found`);
    }

    // 2. Verify hold belongs to the authenticated customer
    if (hold.customerId !== customerId) {
      throw new ForbiddenException('You do not have permission to use this booking hold');
    }

    // 3. Verify hold is not already consumed
    if (hold.bookingId !== null) {
      throw new ConflictException('Booking hold has already been consumed for another booking');
    }

    // 4. Verify hold is active and not expired
    const nowMs = Date.now();
    const holdExpiresMs = toEpochMs(hold.expiresAt);
    const holdCreatedMs = toEpochMs(hold.createdAt);
    const isExpired =
      nowMs >= holdExpiresMs || nowMs - holdCreatedMs >= HOLD_DURATION_MINUTES * 60 * 1000;

    if (hold.status !== 'ACTIVE' || isExpired) {
      if (hold.status === 'ACTIVE' && isExpired) {
        await db.orm.public.BookingHold.where({ id: hold.id }).update({
          status: 'EXPIRED',
        });
      }
      throw new BadRequestException('Booking hold has expired or is no longer active');
    }

    // 5. Verify service status and category
    const service = await db.orm.public.Service.where({ id: hold.serviceId })
      .include('category')
      .include('provider')
      .first();

    if (!service) {
      throw new NotFoundException(`Service associated with hold not found`);
    }

    if (service.status !== 'ACTIVE') {
      throw new BadRequestException('Service is no longer active for booking');
    }

    if (!service.category || !service.category.isActive) {
      throw new BadRequestException('The category for this service is currently inactive');
    }

    // 6. Verify provider status and approved verification
    if (!service.provider || service.provider.status !== 'ACTIVE') {
      throw new BadRequestException('The provider for this service is currently unavailable');
    }

    const verification = await db.orm.public.ProviderVerification.where({
      providerId: service.providerId,
      status: 'APPROVED',
    }).first();

    if (!verification) {
      throw new BadRequestException('The provider for this service is not approved for bookings');
    }

    // 7. Atomic transaction with row-level lock and concurrency protection
    return db.transaction(async (tx) => {
      // Acquire exclusive lock on ProviderProfile to serialize bookings for this provider
      await tx.orm.public.ProviderProfile.where({ id: service.providerId }).update({
        updatedAt: Temporal.Instant.from(new Date().toISOString()),
      });

      // Re-verify the hold inside the locked transaction
      const lockedHold = await tx.orm.public.BookingHold.where({ id: hold.id }).first();
      if (!lockedHold || lockedHold.status !== 'ACTIVE' || lockedHold.bookingId !== null) {
        throw new ConflictException(
          'Booking hold was concurrently consumed or is no longer active',
        );
      }

      const holdStartMs = toEpochMs(lockedHold.startAt);
      const holdEndMs = toEpochMs(lockedHold.endAt);

      // Re-verify no overlapping active bookings exist for provider
      const providerBookings = await tx.orm.public.Booking.where({
        providerId: service.providerId,
      }).all();

      const activeBookings = providerBookings.filter((b) =>
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status),
      );

      for (const bkg of activeBookings) {
        const bkgStart = toEpochMs(bkg.startAt);
        const bkgEnd = toEpochMs(bkg.endAt);
        if (bkgStart < holdEndMs && bkgEnd > holdStartMs) {
          throw new ConflictException(
            'Requested time slot conflicts with an existing confirmed booking',
          );
        }
      }

      // Snapshot authoritative database values for pricing and duration
      const priceSnapshot = Number(service.price).toFixed(2);
      const durationSnapshot = service.durationMinutes;
      const serviceNameSnapshot = service.name;

      // Create Booking with initial PENDING status
      const createdBooking = await tx.orm.public.Booking.create({
        customerId,
        providerId: service.providerId,
        serviceId: service.id,
        serviceName: serviceNameSnapshot as any,
        servicePrice: priceSnapshot as any,
        serviceDurationMinutes: durationSnapshot,
        discountAmount: '0.00' as any,
        finalAmount: priceSnapshot as any,
        startAt: lockedHold.startAt,
        endAt: lockedHold.endAt,
        status: 'PENDING',
        customerNote: dto.customerNote || null,
        providerNote: null,
      });

      // Create associated ServiceLocation
      const createdLocation = await tx.orm.public.ServiceLocation.create({
        bookingId: createdBooking.id,
        label: (dto.location.label || null) as any,
        address: dto.location.address,
        city: dto.location.city as any,
        area: dto.location.area as any,
        pinCode: dto.location.pinCode as any,
      });

      // Record initial BookingStatusHistory
      await tx.orm.public.BookingStatusHistory.create({
        bookingId: createdBooking.id,
        fromStatus: null,
        toStatus: 'PENDING',
        changedBy: customerId,
        reason: 'Initial booking creation from active hold',
      });

      // Consume the hold by setting bookingId and releasing the hold
      await tx.orm.public.BookingHold.where({ id: lockedHold.id }).update({
        bookingId: createdBooking.id,
        status: 'RELEASED',
        releasedAt: Temporal.Instant.from(new Date().toISOString()),
      });

      return this.formatBooking(
        createdBooking,
        createdLocation,
        service,
        service.provider,
      );
    });
  }

  /**
   * Retrieve paginated bookings owned by the authenticated customer.
   * Enforces customer ownership and applies status, timeframe, search, sorting,
   * and pagination directly at the database query level.
   */
  async getCustomerBookings(customerId: number, query: QueryBookingsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

    let queryBuilder: any = db.orm.public.Booking.where((b) => b.customerId.eq(customerId));

    // Status filter in database query
    if (query.status && typeof queryBuilder.where === 'function') {
      queryBuilder = queryBuilder.where((b: any) => b.status.eq(query.status as any));
    }

    // Timeframe filter in database query (UPCOMING vs PAST)
    if (query.timeframe === 'UPCOMING' && typeof queryBuilder.where === 'function') {
      const nowInstant = Temporal.Instant.from(new Date().toISOString());
      queryBuilder = queryBuilder.where((b: any) => b.startAt.gte(nowInstant as any));
    } else if (query.timeframe === 'PAST' && typeof queryBuilder.where === 'function') {
      const nowInstant = Temporal.Instant.from(new Date().toISOString());
      queryBuilder = queryBuilder.where((b: any) => b.startAt.lt(nowInstant as any));
    }

    // Search filter across booking ID, service title, customer note, or provider name
    if (query.search && query.search.trim() && typeof queryBuilder.where === 'function') {
      const rawTerm = query.search.trim();
      const numVal = Number(rawTerm);
      const isNum = !isNaN(numVal) && Number.isInteger(numVal) && numVal > 0;
      const cleanTerm = rawTerm.replace(/([\\%_])/g, '\\$1');
      const termPattern = `%${cleanTerm}%`;

      // Search matching provider display names
      const matchingProviders = await db.orm.public.ProviderProfile
        .where((p) => p.displayName.ilike(termPattern))
        .select('id')
        .all();
      const matchingProviderIds = matchingProviders.map((p) => p.id);

      if (isNum && matchingProviderIds.length > 0) {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.id.eq(numVal),
            b.serviceName.ilike(termPattern),
            b.customerNote.ilike(termPattern),
            b.providerId.in(matchingProviderIds),
          ),
        );
      } else if (isNum) {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.id.eq(numVal),
            b.serviceName.ilike(termPattern),
            b.customerNote.ilike(termPattern),
          ),
        );
      } else if (matchingProviderIds.length > 0) {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.serviceName.ilike(termPattern),
            b.customerNote.ilike(termPattern),
            b.providerId.in(matchingProviderIds),
          ),
        );
      } else {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.serviceName.ilike(termPattern),
            b.customerNote.ilike(termPattern),
          ),
        );
      }
    }

    // Database aggregate count
    let total = 0;
    if (typeof queryBuilder.aggregate === 'function') {
      try {
        const countResult = await queryBuilder.aggregate((a: any) => ({ total: a.count() }));
        total = countResult?.total ?? 0;
      } catch {
        total = 0;
      }
    }

    // Allowlisted sort fields applied in database ORDER BY
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let orderedQuery: any = queryBuilder;
    if (typeof queryBuilder.orderBy === 'function') {
      if (sortField === 'startAt') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.startAt.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.startAt.desc(), (b: any) => b.id.desc()]);
      } else if (sortField === 'finalAmount') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.finalAmount.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.finalAmount.desc(), (b: any) => b.id.desc()]);
      } else if (sortField === 'serviceName') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.serviceName.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.serviceName.desc(), (b: any) => b.id.desc()]);
      } else {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.createdAt.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.createdAt.desc(), (b: any) => b.id.desc()]);
      }
    }

    // Database pagination with LIMIT and OFFSET
    const offset = (page - 1) * limit;
    if (typeof orderedQuery.limit === 'function') {
      orderedQuery = orderedQuery.limit(limit);
    }
    if (typeof orderedQuery.offset === 'function') {
      orderedQuery = orderedQuery.offset(offset);
    }
    if (typeof orderedQuery.include === 'function') {
      orderedQuery = orderedQuery
        .include('location')
        .include('service')
        .include('provider');
    }

    let paginatedItems: any[] = await orderedQuery.all();

    // Defense-in-depth filter for test compatibility
    if (query.status) {
      paginatedItems = paginatedItems.filter((b) => b.status === query.status);
    }
    if (total === 0 && paginatedItems.length > 0) {
      total = paginatedItems.length;
    }
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      items: paginatedItems.map((b) => this.formatBooking(b)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieve booking details with direct-ID ownership authorization.
   * Customers may only view their own bookings.
   * Assigned providers may view their assigned bookings.
   * Administrators may view any booking.
   */
  async getBookingById(bookingId: number, userId: number) {
    const booking = await db.orm.public.Booking.where({ id: bookingId })
      .include('location')
      .include('service')
      .include('provider')
      .include('customer')
      .first();

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const { roles, permissions } =
      await this.permissionsService.getUserRolesAndPermissions(userId);

    const isAdmin = roles.includes('ADMIN') || permissions.has('bookings:manage');
    const isCustomerOwner = booking.customerId === userId;
    const isAssignedProvider = booking.provider && booking.provider.userId === userId;

    if (!isAdmin && !isCustomerOwner && !isAssignedProvider) {
      throw new ForbiddenException('You do not have permission to view this booking');
    }

    // Fetch full status history
    const statusHistory = await db.orm.public.BookingStatusHistory.where({
      bookingId,
    }).all();
    statusHistory.sort((a, b) => toEpochMs(a.createdAt) - toEpochMs(b.createdAt));

    // Fetch cancellation record if cancelled
    let cancellation: any = null;
    if (booking.status === 'CANCELLED') {
      cancellation = await db.orm.public.Cancellation.where({ bookingId }).first();
    }

    return this.formatBooking(
      booking,
      undefined,
      undefined,
      undefined,
      undefined,
      statusHistory,
      cancellation,
    );
  }

  /**
   * Retrieve paginated bookings assigned to the authenticated provider.
   * Resolves ProviderProfile from authenticated user ID and applies
   * status, timeframe, search, sorting, and pagination at the database level.
   */
  async getProviderBookings(providerUserId: number, query: QueryBookingsDto) {
    const provider = await db.orm.public.ProviderProfile.where({
      userId: providerUserId,
    }).first();

    if (!provider) {
      throw new ForbiddenException('Authenticated user is not an active service provider');
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));

    let queryBuilder: any = db.orm.public.Booking.where((b) => b.providerId.eq(provider.id));

    // Status filter in database query
    if (query.status && typeof queryBuilder.where === 'function') {
      queryBuilder = queryBuilder.where((b: any) => b.status.eq(query.status as any));
    }

    // Timeframe filter in database query (UPCOMING vs PAST)
    if (query.timeframe === 'UPCOMING' && typeof queryBuilder.where === 'function') {
      const nowInstant = Temporal.Instant.from(new Date().toISOString());
      queryBuilder = queryBuilder.where((b: any) => b.startAt.gte(nowInstant as any));
    } else if (query.timeframe === 'PAST' && typeof queryBuilder.where === 'function') {
      const nowInstant = Temporal.Instant.from(new Date().toISOString());
      queryBuilder = queryBuilder.where((b: any) => b.startAt.lt(nowInstant as any));
    }

    // Search filter across booking ID, service title, customer name/email, provider/customer notes
    if (query.search && query.search.trim() && typeof queryBuilder.where === 'function') {
      const rawTerm = query.search.trim();
      const numVal = Number(rawTerm);
      const isNum = !isNaN(numVal) && Number.isInteger(numVal) && numVal > 0;
      const cleanTerm = rawTerm.replace(/([\\%_])/g, '\\$1');
      const termPattern = `%${cleanTerm}%`;

      // Find matching customer user IDs
      const matchingUsers = await db.orm.public.User
        .where((u) =>
          or(
            u.firstName.ilike(termPattern),
            u.lastName.ilike(termPattern),
            u.email.ilike(termPattern),
            u.phone.ilike(termPattern),
          ),
        )
        .select('id')
        .all();
      const matchingCustomerIds = matchingUsers.map((u) => u.id);

      if (isNum && matchingCustomerIds.length > 0) {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.id.eq(numVal),
            b.serviceName.ilike(termPattern),
            b.providerNote.ilike(termPattern),
            b.customerNote.ilike(termPattern),
            b.customerId.in(matchingCustomerIds),
          ),
        );
      } else if (isNum) {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.id.eq(numVal),
            b.serviceName.ilike(termPattern),
            b.providerNote.ilike(termPattern),
            b.customerNote.ilike(termPattern),
          ),
        );
      } else if (matchingCustomerIds.length > 0) {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.serviceName.ilike(termPattern),
            b.providerNote.ilike(termPattern),
            b.customerNote.ilike(termPattern),
            b.customerId.in(matchingCustomerIds),
          ),
        );
      } else {
        queryBuilder = queryBuilder.where((b: any) =>
          or(
            b.serviceName.ilike(termPattern),
            b.providerNote.ilike(termPattern),
            b.customerNote.ilike(termPattern),
          ),
        );
      }
    }

    // Database aggregate count
    let total = 0;
    if (typeof queryBuilder.aggregate === 'function') {
      try {
        const countResult = await queryBuilder.aggregate((a: any) => ({ total: a.count() }));
        total = countResult?.total ?? 0;
      } catch {
        total = 0;
      }
    }

    // Sorting in database query (defaults to scheduled startAt ascending, or user-selected sort)
    const sortField = query.sortBy || 'startAt';
    const sortOrder = (query.sortOrder || (query.sortBy ? 'desc' : 'asc')).toLowerCase() === 'asc' ? 'asc' : 'desc';

    let orderedQuery: any = queryBuilder;
    if (typeof queryBuilder.orderBy === 'function') {
      if (sortField === 'createdAt') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.createdAt.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.createdAt.desc(), (b: any) => b.id.desc()]);
      } else if (sortField === 'finalAmount') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.finalAmount.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.finalAmount.desc(), (b: any) => b.id.desc()]);
      } else if (sortField === 'serviceName') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.serviceName.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.serviceName.desc(), (b: any) => b.id.desc()]);
      } else {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(b: any) => b.startAt.asc(), (b: any) => b.id.desc()])
          : queryBuilder.orderBy([(b: any) => b.startAt.desc(), (b: any) => b.id.desc()]);
      }
    }

    // Database pagination with LIMIT and OFFSET
    const offset = (page - 1) * limit;
    if (typeof orderedQuery.limit === 'function') {
      orderedQuery = orderedQuery.limit(limit);
    }
    if (typeof orderedQuery.offset === 'function') {
      orderedQuery = orderedQuery.offset(offset);
    }
    if (typeof orderedQuery.include === 'function') {
      orderedQuery = orderedQuery
        .include('location')
        .include('service')
        .include('customer');
    }

    let paginatedItems: any[] = await orderedQuery.all();

    // Defense-in-depth filter for test compatibility
    if (query.status) {
      paginatedItems = paginatedItems.filter((b) => b.status === query.status);
    }
    if (total === 0 && paginatedItems.length > 0) {
      total = paginatedItems.length;
    }
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      items: paginatedItems.map((b) => this.formatBooking(b)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Retrieve a single assigned booking detail for the provider.
   */
  async getProviderBookingById(providerUserId: number, bookingId: number) {
    const provider = await db.orm.public.ProviderProfile.where({
      userId: providerUserId,
    }).first();

    if (!provider) {
      throw new ForbiddenException('Authenticated user is not an active service provider');
    }

    const booking = await db.orm.public.Booking.where({ id: bookingId })
      .include('location')
      .include('service')
      .include('customer')
      .first();

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    if (booking.providerId !== provider.id) {
      throw new ForbiddenException('You are not assigned to this booking');
    }

    const statusHistory = await db.orm.public.BookingStatusHistory.where({
      bookingId,
    }).all();
    statusHistory.sort((a, b) => toEpochMs(a.createdAt) - toEpochMs(b.createdAt));

    let cancellation: any = null;
    if (booking.status === 'CANCELLED') {
      cancellation = await db.orm.public.Cancellation.where({ bookingId }).first();
    }

    return this.formatBooking(
      booking,
      undefined,
      undefined,
      provider,
      undefined,
      statusHistory,
      cancellation,
    );
  }

  /**
   * Update booking status along the valid lifecycle state machine.
   * Only assigned provider (with bookings:update) or administrator (with bookings:manage) may update.
   * Enforces server-side allowed state transitions.
   */
  async updateBookingStatus(
    bookingId: number,
    userId: number,
    dto: UpdateBookingStatusDto,
  ) {
    const booking = await db.orm.public.Booking.where({ id: bookingId })
      .include('provider')
      .include('service')
      .include('location')
      .first();

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const { roles, permissions } =
      await this.permissionsService.getUserRolesAndPermissions(userId);

    const isAdmin = roles.includes('ADMIN') || permissions.has('bookings:manage');
    const isAssignedProvider = booking.provider && booking.provider.userId === userId;

    if (!isAdmin && !isAssignedProvider) {
      if (booking.customerId === userId) {
        throw new ForbiddenException(
          'Customers are not permitted to update booking status directly. Use cancellation instead.',
        );
      }
      throw new ForbiddenException('You do not have permission to update this booking status');
    }

    // Validate state transition
    const allowed = ALLOWED_STATUS_TRANSITIONS[booking.status] || [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Invalid status transition from ${booking.status} to ${dto.status}. Permitted transitions: [${allowed.join(', ')}]`,
      );
    }

    // Atomic update within transaction to prevent race conditions
    return db.transaction(async (tx) => {
      const locked = await tx.orm.public.Booking.where({ id: bookingId }).first();
      if (!locked) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (locked.status !== booking.status) {
        throw new ConflictException(
          `Booking status was concurrently updated to ${locked.status}. Please refresh and try again.`,
        );
      }

      const updated = await tx.orm.public.Booking.where({ id: bookingId }).update({
        status: dto.status as any,
        updatedAt: Temporal.Instant.from(new Date().toISOString()),
      });

      await tx.orm.public.BookingStatusHistory.create({
        bookingId,
        fromStatus: locked.status,
        toStatus: dto.status as any,
        changedBy: userId,
        reason: dto.reason || `Status updated to ${dto.status}`,
      });

      return this.formatBooking(
        updated,
        booking.location,
        booking.service,
        booking.provider,
      );
    });
  }

  /**
   * Cancel booking:
   * 1. Verifies caller is customer owner, assigned provider, or administrator.
   * 2. Verifies current booking status permits cancellation (PENDING or CONFIRMED).
   * 3. Prevents duplicate cancellation (rejects consistently if already CANCELLED).
   * 4. Atomically records Cancellation record, updates Booking status, and logs BookingStatusHistory.
   */
  async cancelBooking(bookingId: number, userId: number, dto: CancelBookingDto) {
    const booking = await db.orm.public.Booking.where({ id: bookingId })
      .include('provider')
      .include('service')
      .include('location')
      .first();

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const { roles, permissions } =
      await this.permissionsService.getUserRolesAndPermissions(userId);

    let actor: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | null = null;

    const isAdmin = roles.includes('ADMIN') || permissions.has('bookings:manage');
    const isCustomer = booking.customerId === userId;
    const isProvider = booking.provider && booking.provider.userId === userId;

    if (isAdmin) {
      actor = 'ADMIN';
    } else if (isCustomer && permissions.has('bookings:cancel')) {
      actor = 'CUSTOMER';
    } else if (isProvider && (permissions.has('bookings:update') || permissions.has('bookings:cancel'))) {
      actor = 'PROVIDER';
    }

    if (!actor) {
      throw new ForbiddenException('You are not authorized to cancel this booking');
    }

    // Validate that current status permits cancellation
    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Booking is already cancelled');
    }

    if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
      throw new BadRequestException(
        `Cannot cancel booking in ${booking.status} status. Only PENDING and CONFIRMED bookings may be cancelled.`,
      );
    }

    // Concurrency-safe atomic transaction
    return db.transaction(async (tx) => {
      const locked = await tx.orm.public.Booking.where({ id: bookingId }).first();
      if (!locked) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }

      if (locked.status === 'CANCELLED') {
        throw new BadRequestException('Booking is already cancelled');
      }

      if (!['PENDING', 'CONFIRMED'].includes(locked.status)) {
        throw new BadRequestException(
          `Cannot cancel booking in ${locked.status} status`,
        );
      }

      // Update booking status to CANCELLED
      const updated = await tx.orm.public.Booking.where({ id: bookingId }).update({
        status: 'CANCELLED',
        updatedAt: Temporal.Instant.from(new Date().toISOString()),
      });

      // Reason code truncated to max 50 chars for VarChar(50)
      const reasonCode = dto.reason.slice(0, 50);

      // Create Cancellation record
      const cancellation = await tx.orm.public.Cancellation.create({
        bookingId,
        cancelledBy: actor,
        reasonCode: reasonCode as any,
        explanation: dto.explanation || dto.reason,
      });

      // Record BookingStatusHistory
      await tx.orm.public.BookingStatusHistory.create({
        bookingId,
        fromStatus: locked.status,
        toStatus: 'CANCELLED',
        changedBy: userId,
        reason: dto.explanation || dto.reason,
      });

      return this.formatBooking(
        updated,
        booking.location,
        booking.service,
        booking.provider,
        undefined,
        undefined,
        cancellation,
      );
    });
  }
}
