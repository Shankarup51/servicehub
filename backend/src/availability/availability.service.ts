import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { Temporal } from 'temporal-polyfill';
import { CreateAvailabilityDto, DayOfWeekEnum } from './dto/create-availability.dto.js';
import { QueryPublicAvailabilityDto } from './dto/query-public-availability.dto.js';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto.js';
import { UpdateBlockedSlotDto } from './dto/update-blocked-slot.dto.js';

const DAY_NAMES = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function toEpochMs(val: any): number {
  if (!val) return 0;
  if (typeof val.epochMilliseconds === 'number') return val.epochMilliseconds;
  if (typeof val.epochMilliseconds === 'bigint') return Number(val.epochMilliseconds);
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'string' || typeof val === 'number') return new Date(val).getTime();
  if (typeof val.toString === 'function') return new Date(val.toString()).getTime();
  return 0;
}

@Injectable()
export class AvailabilityService {
  /**
   * Helper to retrieve active ProviderProfile by userId.
   */
  private async getProviderProfile(userId: number, requireActive = true) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new NotFoundException('Provider profile not found for authenticated user');
    }
    if (requireActive && profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }
    return profile;
  }

  /**
   * Helper to format a Temporal.PlainTime or Postgres Time output to HH:mm string.
   */
  private formatTime(time: any): string {
    if (!time) return '';
    if (typeof time === 'string') {
      return time.slice(0, 5);
    }
    if (typeof time.toString === 'function') {
      return time.toString().slice(0, 5);
    }
    return String(time);
  }

  // ==========================================================================
  // Provider Weekly Availability
  // ==========================================================================

  /**
   * Retrieve authenticated provider's weekly availability schedule.
   */
  async getOwnAvailability(userId: number) {
    const profile = await this.getProviderProfile(userId, false);

    const schedules = await db.orm.public.Availability.where({
      providerId: profile.id,
    }).all();

    const dayOrder: Record<string, number> = {
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
      SUNDAY: 7,
    };

    schedules.sort((a, b) => {
      const orderA = dayOrder[a.dayOfWeek] || 0;
      const orderB = dayOrder[b.dayOfWeek] || 0;
      if (orderA !== orderB) return orderA - orderB;
      const tA = this.formatTime(a.startTime);
      const tB = this.formatTime(b.startTime);
      return tA.localeCompare(tB);
    });

    return schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: this.formatTime(s.startTime),
      endTime: this.formatTime(s.endTime),
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  /**
   * Create a new weekly availability schedule for a weekday.
   * Validates time format, endTime > startTime, and prevents overlapping windows for that day.
   */
  async addAvailability(userId: number, dto: CreateAvailabilityDto) {
    const profile = await this.getProviderProfile(userId, true);

    const startTimeStr = dto.startTime.trim().length === 5 ? `${dto.startTime.trim()}:00` : dto.startTime.trim();
    const endTimeStr = dto.endTime.trim().length === 5 ? `${dto.endTime.trim()}:00` : dto.endTime.trim();

    let startTimePlain: any;
    let endTimePlain: any;

    try {
      startTimePlain = Temporal.PlainTime.from(startTimeStr);
      endTimePlain = Temporal.PlainTime.from(endTimeStr);
    } catch {
      throw new BadRequestException('Invalid time format. Please provide HH:mm or HH:mm:ss');
    }

    if (Temporal.PlainTime.compare(endTimePlain, startTimePlain) <= 0) {
      throw new BadRequestException('endTime must be strictly after startTime');
    }

    // Check existing availability for this dayOfWeek to avoid overlapping schedules
    const existing = await db.orm.public.Availability.where({
      providerId: profile.id,
      dayOfWeek: dto.dayOfWeek as any,
    }).all();

    for (const schedule of existing) {
      const exStart = Temporal.PlainTime.from(this.formatTime(schedule.startTime) + ':00');
      const exEnd = Temporal.PlainTime.from(this.formatTime(schedule.endTime) + ':00');

      // Overlap condition: start < exEnd && end > exStart
      const startsBeforeExEnd = Temporal.PlainTime.compare(startTimePlain, exEnd) < 0;
      const endsAfterExStart = Temporal.PlainTime.compare(endTimePlain, exStart) > 0;

      if (startsBeforeExEnd && endsAfterExStart) {
        throw new ConflictException(
          `Availability window (${dto.startTime} - ${dto.endTime}) overlaps with an existing schedule (${this.formatTime(schedule.startTime)} - ${this.formatTime(schedule.endTime)}) for ${dto.dayOfWeek}`,
        );
      }
    }

    const created = await db.orm.public.Availability.create({
      providerId: profile.id,
      dayOfWeek: dto.dayOfWeek as any,
      startTime: startTimePlain,
      endTime: endTimePlain,
    });

    return {
      id: created.id,
      dayOfWeek: created.dayOfWeek,
      startTime: this.formatTime(created.startTime),
      endTime: this.formatTime(created.endTime),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Delete an availability schedule entry. Enforces provider ownership.
   */
  async deleteAvailability(id: number, userId: number) {
    const profile = await this.getProviderProfile(userId, true);

    const schedule = await db.orm.public.Availability.where({ id }).first();
    if (!schedule) {
      throw new NotFoundException(`Availability schedule with ID ${id} not found`);
    }

    if (schedule.providerId !== profile.id) {
      throw new ForbiddenException('You do not have permission to delete this availability schedule');
    }

    await db.orm.public.Availability.where({ id }).delete();

    return {
      message: `Availability schedule for ${schedule.dayOfWeek} deleted successfully`,
    };
  }

  // ==========================================================================
  // Provider Blocked Slots
  // ==========================================================================

  /**
   * List authenticated provider's blocked slots.
   */
  async getOwnBlockedSlots(userId: number) {
    const profile = await this.getProviderProfile(userId, false);

    const slots = await db.orm.public.BlockedSlot.where({
      providerId: profile.id,
    }).all();

    slots.sort((a, b) => toEpochMs(a.startAt) - toEpochMs(b.startAt));

    return slots.map((s) => ({
      id: s.id,
      startAt: s.startAt,
      endAt: s.endAt,
      reason: s.reason,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  /**
   * Create a blocked time range for the provider.
   * Validates timestamps, ensures no conflict with existing confirmed bookings, and prevents overlapping blocks.
   */
  async createBlockedSlot(userId: number, dto: CreateBlockedSlotDto) {
    const profile = await this.getProviderProfile(userId, true);

    const startDate = new Date(dto.startAt);
    const endDate = new Date(dto.endAt);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt timestamp format');
    }

    if (endDate.getTime() <= startDate.getTime()) {
      throw new BadRequestException('endAt must be strictly after startAt');
    }

    if (endDate.getTime() <= Date.now()) {
      throw new BadRequestException('Cannot create a blocked slot entirely in the past');
    }

    // 1. Critical Requirement: Check for existing confirmed or pending bookings in this range
    // "Do not allow a blocked slot to silently invalidate an existing confirmed booking."
    const existingBookings = await db.orm.public.Booking.where({
      providerId: profile.id,
    }).all();

    const activeBookings = existingBookings.filter((b) =>
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status),
    );

    for (const booking of activeBookings) {
      const bStart = toEpochMs(booking.startAt);
      const bEnd = toEpochMs(booking.endAt);

      // Overlap: bStart < endDate && bEnd > startDate
      if (bStart < endDate.getTime() && bEnd > startDate.getTime()) {
        throw new ConflictException(
          `Cannot block slot: A ${booking.status.toLowerCase()} booking (#${booking.id}) already exists in this period`,
        );
      }
    }

    // 2. Check for overlapping existing blocked slots
    const existingBlocks = await db.orm.public.BlockedSlot.where({
      providerId: profile.id,
    }).all();

    for (const block of existingBlocks) {
      const blkStart = toEpochMs(block.startAt);
      const blkEnd = toEpochMs(block.endAt);

      if (blkStart < endDate.getTime() && blkEnd > startDate.getTime()) {
        throw new ConflictException(
          `This time range overlaps with an existing blocked slot (#${block.id})`,
        );
      }
    }

    const created = await db.orm.public.BlockedSlot.create({
      providerId: profile.id,
      startAt: Temporal.Instant.from(startDate.toISOString()),
      endAt: Temporal.Instant.from(endDate.toISOString()),
      reason: dto.reason.trim() as any,
    });

    return {
      id: created.id,
      startAt: created.startAt,
      endAt: created.endAt,
      reason: created.reason,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * Update an owned blocked slot. Enforces provider ownership and booking conflict checks.
   */
  async updateBlockedSlot(id: number, userId: number, dto: UpdateBlockedSlotDto) {
    const profile = await this.getProviderProfile(userId, true);

    const slot = await db.orm.public.BlockedSlot.where({ id }).first();
    if (!slot) {
      throw new NotFoundException(`Blocked slot with ID ${id} not found`);
    }

    if (slot.providerId !== profile.id) {
      throw new ForbiddenException('You do not have permission to modify this blocked slot');
    }

    const targetStart = dto.startAt ? new Date(dto.startAt) : new Date(slot.startAt);
    const targetEnd = dto.endAt ? new Date(dto.endAt) : new Date(slot.endAt);

    if (isNaN(targetStart.getTime()) || isNaN(targetEnd.getTime())) {
      throw new BadRequestException('Invalid startAt or endAt timestamp format');
    }

    if (targetEnd.getTime() <= targetStart.getTime()) {
      throw new BadRequestException('endAt must be strictly after startAt');
    }

    // Check conflicting bookings
    const bookings = await db.orm.public.Booking.where({
      providerId: profile.id,
    }).all();

    const activeBookings = bookings.filter((b) =>
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status),
    );

    for (const b of activeBookings) {
      const bStart = toEpochMs(b.startAt);
      const bEnd = toEpochMs(b.endAt);

      if (bStart < targetEnd.getTime() && bEnd > targetStart.getTime()) {
        throw new ConflictException(
          `Cannot update blocked slot: Overlaps with existing booking #${b.id}`,
        );
      }
    }

    // Check other blocked slots
    const allBlocks = await db.orm.public.BlockedSlot.where({
      providerId: profile.id,
    }).all();

    for (const b of allBlocks) {
      if (b.id === id) continue;
      const bStart = toEpochMs(b.startAt);
      const bEnd = toEpochMs(b.endAt);

      if (bStart < targetEnd.getTime() && bEnd > targetStart.getTime()) {
        throw new ConflictException(
          `Updated time range overlaps with another existing blocked slot (#${b.id})`,
        );
      }
    }

    const payload: Record<string, any> = {};
    if (dto.startAt) payload.startAt = Temporal.Instant.from(targetStart.toISOString());
    if (dto.endAt) payload.endAt = Temporal.Instant.from(targetEnd.toISOString());
    if (dto.reason) payload.reason = dto.reason.trim();

    return db.orm.public.BlockedSlot.where({ id }).update(payload as any);
  }

  /**
   * Delete an owned blocked slot.
   */
  async deleteBlockedSlot(id: number, userId: number) {
    const profile = await this.getProviderProfile(userId, true);

    const slot = await db.orm.public.BlockedSlot.where({ id }).first();
    if (!slot) {
      throw new NotFoundException(`Blocked slot with ID ${id} not found`);
    }

    if (slot.providerId !== profile.id) {
      throw new ForbiddenException('You do not have permission to delete this blocked slot');
    }

    await db.orm.public.BlockedSlot.where({ id }).delete();

    return {
      message: 'Blocked slot deleted successfully',
    };
  }

  // ==========================================================================
  // Public Availability Query
  // ==========================================================================

  /**
   * Retrieve a provider's public availability for a requested date or date range.
   * Public visibility requires:
   * 1. Provider status is ACTIVE.
   * 2. Provider verification status is APPROVED.
   * 3. Provider has at least one ACTIVE service in an active category.
   * Excludes all blocked slots, confirmed bookings, and active holds without leaking sensitive details.
   */
  async getPublicAvailability(providerId: number, query: QueryPublicAvailabilityDto) {
    // 1. Verify provider eligibility
    const provider = await db.orm.public.ProviderProfile.where({ id: providerId }).first();
    if (!provider || provider.status !== 'ACTIVE') {
      throw new NotFoundException(`Provider with ID ${providerId} is not available`);
    }

    const verification = await db.orm.public.ProviderVerification.where({
      providerId,
      status: 'APPROVED',
    }).first();

    if (!verification) {
      throw new NotFoundException(`Provider with ID ${providerId} is not verified`);
    }

    const activeServices = await db.orm.public.Service.where({
      providerId,
      status: 'ACTIVE',
    })
      .include('category')
      .all();

    const bookableServices = activeServices.filter(
      (s) => s.category && s.category.isActive,
    );

    if (bookableServices.length === 0) {
      throw new NotFoundException(`Provider has no publicly bookable services at this time`);
    }

    // 2. Determine requested dates
    let targetDates: string[] = [];
    if (query.date) {
      targetDates = [query.date];
    } else if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end.getTime() < start.getTime()) {
        throw new BadRequestException('Invalid date range parameters');
      }
      const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 3600 * 1000));
      if (diffDays > 14) {
        throw new BadRequestException('Date range cannot exceed 14 days');
      }
      const cur = new Date(start);
      while (cur <= end) {
        targetDates.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
    } else {
      // Default: next 7 days
      const cur = new Date();
      for (let i = 0; i < 7; i++) {
        targetDates.push(cur.toISOString().slice(0, 10));
        cur.setDate(cur.getDate() + 1);
      }
    }

    // 3. Optional service duration segmenting
    let serviceDurationMinutes = 60;
    if (query.serviceId) {
      const selectedService = bookableServices.find((s) => s.id === query.serviceId);
      if (!selectedService) {
        throw new BadRequestException(`Service with ID ${query.serviceId} is not valid for this provider`);
      }
      serviceDurationMinutes = selectedService.durationMinutes;
    }

    // 4. Fetch all provider availability schedules
    const availabilitySchedules = await db.orm.public.Availability.where({
      providerId,
    }).all();

    // 5. Fetch all blocked slots for this provider
    const blockedSlots = await db.orm.public.BlockedSlot.where({
      providerId,
    }).all();

    // 6. Fetch all active bookings
    const bookings = await db.orm.public.Booking.where({
      providerId,
    }).all();
    const activeBookings = bookings.filter((b) =>
      ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status),
    );

    // 7. Fetch active unexpired holds
    const holds = await db.orm.public.BookingHold.where({
      providerId,
      status: 'ACTIVE',
    }).all();

    const now = Date.now();
    const activeHolds = holds.filter((h) => {
      const expTime = toEpochMs(h.expiresAt);
      const createdTime = toEpochMs(h.createdAt);
      const isHoldExpired = now >= expTime || now - createdTime >= 15 * 60 * 1000;
      return !isHoldExpired;
    });

    const timezone = provider.timezone || 'UTC';
    const availabilityByDate: Array<{
      date: string;
      dayOfWeek: string;
      slots: Array<{ startAt: string; endAt: string }>;
    }> = [];

    for (const dateStr of targetDates) {
      // Determine dayOfWeek in provider's timezone
      // Parse PlainDate in timezone
      let plainDate: any;
      try {
        plainDate = Temporal.PlainDate.from(dateStr);
      } catch {
        continue;
      }

      // Temporal dayOfWeek: 1 = Monday, 7 = Sunday
      const dayIndexMap: Record<number, DayOfWeekEnum> = {
        1: DayOfWeekEnum.MONDAY,
        2: DayOfWeekEnum.TUESDAY,
        3: DayOfWeekEnum.WEDNESDAY,
        4: DayOfWeekEnum.THURSDAY,
        5: DayOfWeekEnum.FRIDAY,
        6: DayOfWeekEnum.SATURDAY,
        7: DayOfWeekEnum.SUNDAY,
      };

      const dayEnum = dayIndexMap[plainDate.dayOfWeek];
      const schedulesForDay = availabilitySchedules.filter((s) => s.dayOfWeek === dayEnum);

      if (schedulesForDay.length === 0) {
        availabilityByDate.push({
          date: dateStr,
          dayOfWeek: dayEnum,
          slots: [],
        });
        continue;
      }

      const availableSlotsForDate: Array<{ startAt: string; endAt: string }> = [];

      for (const schedule of schedulesForDay) {
        const startFormatted = this.formatTime(schedule.startTime) + ':00';
        const endFormatted = this.formatTime(schedule.endTime) + ':00';

        let windowStartInstant: any;
        let windowEndInstant: any;

        try {
          const zdtStart = plainDate.toZonedDateTime({
            plainTime: startFormatted,
            timeZone: timezone,
          });
          const zdtEnd = plainDate.toZonedDateTime({
            plainTime: endFormatted,
            timeZone: timezone,
          });
          windowStartInstant = zdtStart.toInstant();
          windowEndInstant = zdtEnd.toInstant();
        } catch {
          continue;
        }

        const windowStartMs = windowStartInstant.epochMilliseconds;
        const windowEndMs = windowEndInstant.epochMilliseconds;
        const slotDurationMs = serviceDurationMinutes * 60 * 1000;

        let candidateStartMs = windowStartMs;

        while (candidateStartMs + slotDurationMs <= windowEndMs) {
          const candidateEndMs = candidateStartMs + slotDurationMs;

          // Check if candidate slot is in the past
          if (candidateStartMs <= now) {
            candidateStartMs += 30 * 60 * 1000; // Increment by 30 min step
            continue;
          }

          // Check overlap with BlockedSlots
          const overlapsBlocked = blockedSlots.some((blk) => {
            const blkStart = toEpochMs(blk.startAt);
            const blkEnd = toEpochMs(blk.endAt);
            return candidateStartMs < blkEnd && candidateEndMs > blkStart;
          });

          // Check overlap with Active Bookings
          const overlapsBooking = activeBookings.some((bkg) => {
            const bkgStart = toEpochMs(bkg.startAt);
            const bkgEnd = toEpochMs(bkg.endAt);
            return candidateStartMs < bkgEnd && candidateEndMs > bkgStart;
          });

          // Check overlap with Active Holds
          const overlapsHold = activeHolds.some((hld) => {
            const hldStart = toEpochMs(hld.startAt);
            const hldEnd = toEpochMs(hld.endAt);
            return candidateStartMs < hldEnd && candidateEndMs > hldStart;
          });

          if (!overlapsBlocked && !overlapsBooking && !overlapsHold) {
            availableSlotsForDate.push({
              startAt: new Date(candidateStartMs).toISOString(),
              endAt: new Date(candidateEndMs).toISOString(),
            });
          }

          candidateStartMs += 30 * 60 * 1000; // 30-minute booking interval step
        }
      }

      availabilityByDate.push({
        date: dateStr,
        dayOfWeek: dayEnum,
        slots: availableSlotsForDate,
      });
    }

    return {
      providerId: provider.id,
      displayName: provider.displayName,
      timezone,
      serviceDurationMinutes,
      availability: availabilityByDate,
    };
  }
}
