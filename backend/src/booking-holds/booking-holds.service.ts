import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { Temporal } from 'temporal-polyfill';
import { CreateBookingHoldDto } from './dto/create-booking-hold.dto.js';

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

const DAY_INDEX_MAP: Record<number, string> = {
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
  7: 'SUNDAY',
};

@Injectable()
export class BookingHoldsService {
  /**
   * Helper to format a time to HH:mm string.
   */
  private formatTime(time: any): string {
    if (!time) return '';
    if (typeof time === 'string') return time.slice(0, 5);
    if (typeof time.toString === 'function') return time.toString().slice(0, 5);
    return String(time);
  }

  /**
   * Reserve a temporary booking hold for an eligible service and requested slot.
   * Concurrency protection: Executes within a database transaction and acquires an exclusive
   * row-level lock on the ProviderProfile, serializing concurrent reservations for that provider.
   */
  async createHold(customerId: number, dto: CreateBookingHoldDto) {
    // 1. Validate service existence and public bookability
    const service = await db.orm.public.Service.where({ id: dto.serviceId })
      .include('category')
      .include('provider')
      .first();

    if (!service) {
      throw new NotFoundException(`Service with ID ${dto.serviceId} not found`);
    }

    if (service.status !== 'ACTIVE') {
      throw new BadRequestException('This service is currently unavailable for booking');
    }

    if (!service.category || !service.category.isActive) {
      throw new BadRequestException('The category for this service is currently inactive');
    }

    // Check parent category if hierarchy exists
    if (service.category.parentId) {
      const parentCat = await db.orm.public.Category.where({
        id: service.category.parentId,
      }).first();
      if (parentCat && !parentCat.isActive) {
        throw new BadRequestException('The parent category for this service is currently inactive');
      }
    }

    // 2. Validate provider status and verification
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

    // 3. Validate timing and calculate slot end
    const startDate = new Date(dto.startAt);
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Invalid startAt timestamp format');
    }

    // Reject slots in the past
    if (startDate.getTime() <= Date.now()) {
      throw new BadRequestException('Booking hold start time must be in the future');
    }

    const durationMs = service.durationMinutes * 60 * 1000;
    const endDate = new Date(startDate.getTime() + durationMs);

    // 4. Validate slot fits within provider's weekly availability
    const timezone = service.provider.timezone || 'UTC';
    let plainDate: any;
    let slotStartTimePlain: any;
    let slotEndTimePlain: any;

    try {
      // Convert startDate to provider's timezone
      const zdtStart = Temporal.Instant.from(startDate.toISOString()).toZonedDateTimeISO(timezone);
      const zdtEnd = Temporal.Instant.from(endDate.toISOString()).toZonedDateTimeISO(timezone);

      plainDate = zdtStart.toPlainDate();
      slotStartTimePlain = zdtStart.toPlainTime();
      slotEndTimePlain = zdtEnd.toPlainTime();
    } catch {
      throw new BadRequestException(`Could not parse slot in provider timezone: ${timezone}`);
    }

    const dayEnum = DAY_INDEX_MAP[plainDate.dayOfWeek];
    const availabilitySchedules = await db.orm.public.Availability.where({
      providerId: service.providerId,
      dayOfWeek: dayEnum as any,
    }).all();

    if (availabilitySchedules.length === 0) {
      throw new BadRequestException(
        `Provider has no working availability scheduled for ${dayEnum}`,
      );
    }

    // Verify requested slot is fully enclosed in at least one working schedule
    const fitsInSchedule = availabilitySchedules.some((schedule) => {
      const schedStart = Temporal.PlainTime.from(this.formatTime(schedule.startTime) + ':00');
      const schedEnd = Temporal.PlainTime.from(this.formatTime(schedule.endTime) + ':00');

      const startsAfterOrAt = Temporal.PlainTime.compare(slotStartTimePlain, schedStart) >= 0;
      const endsBeforeOrAt = Temporal.PlainTime.compare(slotEndTimePlain, schedEnd) <= 0;

      return startsAfterOrAt && endsBeforeOrAt;
    });

    if (!fitsInSchedule) {
      throw new BadRequestException(
        `Requested slot (${this.formatTime(slotStartTimePlain.toString())} - ${this.formatTime(slotEndTimePlain.toString())}) falls outside provider working hours on ${dayEnum}`,
      );
    }

    // 5. Concurrency-Safe Transaction: Lock provider row, check overlaps, insert hold
    return db.transaction(async (tx) => {
      // Acquire exclusive row-level lock on the ProviderProfile in PostgreSQL
      await tx.orm.public.ProviderProfile.where({ id: service.providerId }).update({
        updatedAt: Temporal.Instant.from(new Date().toISOString()),
      });

      const startMs = startDate.getTime();
      const endMs = endDate.getTime();
      const nowMs = Date.now();

      // Check BlockedSlots
      const blockedSlots = await tx.orm.public.BlockedSlot.where({
        providerId: service.providerId,
      }).all();

      for (const blk of blockedSlots) {
        const blkStart = toEpochMs(blk.startAt);
        const blkEnd = toEpochMs(blk.endAt);
        if (blkStart < endMs && blkEnd > startMs) {
          throw new ConflictException(
            'Requested slot is unavailable (provider has blocked this time period)',
          );
        }
      }

      // Check confirmed/in-progress Bookings
      const bookings = await tx.orm.public.Booking.where({
        providerId: service.providerId,
      }).all();

      const activeBookings = bookings.filter((b) =>
        ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status),
      );

      for (const bkg of activeBookings) {
        const bkgStart = toEpochMs(bkg.startAt);
        const bkgEnd = toEpochMs(bkg.endAt);
        if (bkgStart < endMs && bkgEnd > startMs) {
          throw new ConflictException(
            'Requested slot is already booked for another appointment',
          );
        }
      }

      // Check existing active BookingHolds
      const existingHolds = await tx.orm.public.BookingHold.where({
        providerId: service.providerId,
        status: 'ACTIVE',
      }).all();

      for (const hld of existingHolds) {
        const hldStart = toEpochMs(hld.startAt);
        const hldEnd = toEpochMs(hld.endAt);
        const hldExpires = toEpochMs(hld.expiresAt);
        const hldCreated = toEpochMs(hld.createdAt);

        // Expire stale holds on-the-fly inside transaction
        const isStale = nowMs >= hldExpires || (nowMs - hldCreated) >= HOLD_DURATION_MINUTES * 60 * 1000;
        if (isStale) {
          await tx.orm.public.BookingHold.where({ id: hld.id }).update({
            status: 'EXPIRED',
          });
          continue;
        }

        // If held by another active hold, conflict
        if (hldStart < endMs && hldEnd > startMs) {
          throw new ConflictException(
            'Requested slot is currently held by another customer. Please choose a different slot or try again shortly.',
          );
        }
      }

      // 6. Satisfy database check constraint: "expiresAt" > "startAt"
      // In PostgreSQL schema: @@check("\"expiresAt\" > \"startAt\"", name: "booking_hold_expiry_valid")
      // We set expiresAt = max(now + 15m, startAt + 15m) so that expiresAt is strictly > startAt
      const expiresDate = new Date(
        Math.max(nowMs + HOLD_DURATION_MINUTES * 60 * 1000, startMs + HOLD_DURATION_MINUTES * 60 * 1000),
      );

      const hold = await tx.orm.public.BookingHold.create({
        providerId: service.providerId,
        serviceId: service.id,
        customerId,
        startAt: Temporal.Instant.from(startDate.toISOString()),
        endAt: Temporal.Instant.from(endDate.toISOString()),
        expiresAt: Temporal.Instant.from(expiresDate.toISOString()),
        status: 'ACTIVE',
      });

      return {
        id: hold.id,
        serviceId: service.id,
        serviceName: service.name,
        providerId: service.providerId,
        providerDisplayName: service.provider.displayName,
        startAt: hold.startAt,
        endAt: hold.endAt,
        expiresAt: hold.expiresAt,
        holdTimeoutMinutes: HOLD_DURATION_MINUTES,
        status: hold.status,
        createdAt: hold.createdAt,
      };
    });
  }

  /**
   * Retrieve the authenticated customer's current active hold.
   * Cleans up expired holds if any are found.
   */
  async getCustomerActiveHold(customerId: number) {
    const holds = await db.orm.public.BookingHold.where({
      customerId,
      status: 'ACTIVE',
    })
      .include('service')
      .include('provider')
      .all();

    const nowMs = Date.now();
    let activeHold: any = null;

    for (const hold of holds) {
      const hldExpires = toEpochMs(hold.expiresAt);
      const hldCreated = toEpochMs(hold.createdAt);

      const isExpired = nowMs >= hldExpires || (nowMs - hldCreated) >= HOLD_DURATION_MINUTES * 60 * 1000;

      if (isExpired) {
        await db.orm.public.BookingHold.where({ id: hold.id }).update({
          status: 'EXPIRED',
        });
      } else if (!activeHold) {
        activeHold = hold;
      }
    }

    if (!activeHold) {
      return null;
    }

    return {
      id: activeHold.id,
      serviceId: activeHold.serviceId,
      serviceName: activeHold.service ? activeHold.service.name : null,
      price: activeHold.service ? Number(activeHold.service.price) : null,
      durationMinutes: activeHold.service ? activeHold.service.durationMinutes : null,
      providerId: activeHold.providerId,
      providerDisplayName: activeHold.provider ? activeHold.provider.displayName : null,
      startAt: activeHold.startAt,
      endAt: activeHold.endAt,
      expiresAt: activeHold.expiresAt,
      status: activeHold.status,
      createdAt: activeHold.createdAt,
    };
  }

  /**
   * Release / cancel an active booking hold owned by the customer.
   */
  async releaseHold(holdId: number, customerId: number) {
    const hold = await db.orm.public.BookingHold.where({ id: holdId }).first();

    if (!hold) {
      throw new NotFoundException(`Booking hold with ID ${holdId} not found`);
    }

    if (hold.customerId !== customerId) {
      throw new ForbiddenException('You do not have permission to release this booking hold');
    }

    if (hold.status !== 'ACTIVE') {
      throw new BadRequestException(`Booking hold is already ${hold.status.toLowerCase()}`);
    }

    await db.orm.public.BookingHold.where({ id: holdId }).update({
      status: 'RELEASED',
      releasedAt: Temporal.Instant.from(new Date().toISOString()),
    });

    return {
      message: 'Booking hold released successfully',
      id: hold.id,
      status: 'RELEASED',
    };
  }

  /**
   * Safe batch expiration of holds past their timeout.
   */
  async cleanupExpiredHolds() {
    const activeHolds = await db.orm.public.BookingHold.where({
      status: 'ACTIVE',
    }).all();

    const nowMs = Date.now();
    let expiredCount = 0;

    for (const hold of activeHolds) {
      const hldExpires = toEpochMs(hold.expiresAt);
      const hldCreated = toEpochMs(hold.createdAt);

      if (nowMs >= hldExpires || (nowMs - hldCreated) >= HOLD_DURATION_MINUTES * 60 * 1000) {
        await db.orm.public.BookingHold.where({ id: hold.id }).update({
          status: 'EXPIRED',
        });
        expiredCount++;
      }
    }

    return {
      message: `Cleaned up ${expiredCount} expired booking holds`,
      expiredCount,
    };
  }
}
