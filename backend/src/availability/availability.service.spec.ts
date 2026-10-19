import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityService } from './availability.service.js';
import { db } from '../prisma/db.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DayOfWeekEnum } from './dto/create-availability.dto.js';
import { Temporal } from 'temporal-polyfill';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilityService],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addAvailability', () => {
    it('should throw BadRequestException if endTime <= startTime', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      await expect(
        service.addAvailability(10, {
          dayOfWeek: DayOfWeekEnum.MONDAY,
          startTime: '17:00',
          endTime: '09:00',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if window overlaps with existing schedule on that day', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            id: 1,
            providerId: 1,
            dayOfWeek: 'MONDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('13:00:00'),
          },
        ]),
      } as any);

      await expect(
        service.addAvailability(10, {
          dayOfWeek: DayOfWeekEnum.MONDAY,
          startTime: '12:00',
          endTime: '15:00',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create availability window successfully when non-overlapping', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            id: 1,
            providerId: 1,
            dayOfWeek: 'MONDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('12:00:00'),
          },
        ]),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'create').mockResolvedValue({
        id: 2,
        providerId: 1,
        dayOfWeek: 'MONDAY',
        startTime: Temporal.PlainTime.from('13:00:00'),
        endTime: Temporal.PlainTime.from('17:00:00'),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.addAvailability(10, {
        dayOfWeek: DayOfWeekEnum.MONDAY,
        startTime: '13:00',
        endTime: '17:00',
      });

      expect(result.id).toBe(2);
      expect(result.startTime).toBe('13:00');
      expect(result.endTime).toBe('17:00');
    });

    it('should throw ForbiddenException if provider is suspended', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'SUSPENDED' }),
      } as any);

      await expect(
        service.addAvailability(10, {
          dayOfWeek: DayOfWeekEnum.MONDAY,
          startTime: '09:00',
          endTime: '17:00',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteAvailability', () => {
    it('should throw ForbiddenException if schedule belongs to another provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 99, providerId: 2, dayOfWeek: 'MONDAY' }),
      } as any);

      await expect(service.deleteAvailability(99, 10)).rejects.toThrow(ForbiddenException);
    });

    it('should delete schedule successfully when owned by provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, providerId: 1, dayOfWeek: 'MONDAY' }),
        delete: jest.fn().mockResolvedValue({ id: 1 }),
      } as any);

      const res = await service.deleteAvailability(1, 10);
      expect(res.message).toContain('deleted successfully');
    });
  });

  describe('createBlockedSlot', () => {
    it('should throw BadRequestException if endAt <= startAt', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      await expect(
        service.createBlockedSlot(10, {
          startAt: '2026-10-25T15:00:00.000Z',
          endAt: '2026-10-25T14:00:00.000Z',
          reason: 'Invalid interval',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if blocked slot overlaps with a confirmed booking', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            id: 101,
            providerId: 1,
            status: 'CONFIRMED',
            startAt: new Date('2026-10-25T10:00:00.000Z'),
            endAt: new Date('2026-10-25T11:00:00.000Z'),
          },
        ]),
      } as any);

      await expect(
        service.createBlockedSlot(10, {
          startAt: '2026-10-25T10:30:00.000Z',
          endAt: '2026-10-25T12:00:00.000Z',
          reason: 'Holiday',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create blocked slot when no conflicts exist', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.BlockedSlot, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.BlockedSlot, 'create').mockResolvedValue({
        id: 5,
        providerId: 1,
        startAt: new Date('2026-10-25T14:00:00.000Z'),
        endAt: new Date('2026-10-25T16:00:00.000Z'),
        reason: 'Maintenance',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const result = await service.createBlockedSlot(10, {
        startAt: '2026-10-25T14:00:00.000Z',
        endAt: '2026-10-25T16:00:00.000Z',
        reason: 'Maintenance',
      });

      expect(result.id).toBe(5);
      expect(result.reason).toBe('Maintenance');
    });
  });

  describe('getPublicAvailability', () => {
    it('should throw NotFoundException if provider is not verified', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.getPublicAvailability(1, { date: '2026-10-25' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate available slots excluding blocked periods and booked slots', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 1,
          displayName: 'Apex Pro',
          status: 'ACTIVE',
          timezone: 'UTC',
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([
          {
            id: 20,
            providerId: 1,
            name: 'Cleaning',
            durationMinutes: 60,
            status: 'ACTIVE',
            category: { id: 1, isActive: true },
          },
        ]),
      } as any);

      // Sunday schedule: 09:00 - 12:00 UTC
      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            id: 1,
            providerId: 1,
            dayOfWeek: 'SUNDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('12:00:00'),
          },
        ]),
      } as any);

      // Blocked slot from 09:30 to 10:30 UTC
      jest.spyOn(db.orm.public.BlockedSlot, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            id: 1,
            startAt: new Date('2026-10-25T09:30:00.000Z'),
            endAt: new Date('2026-10-25T10:30:00.000Z'),
          },
        ]),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      // 2026-10-25 is a Sunday
      const res = await service.getPublicAvailability(1, {
        date: '2026-10-25',
        serviceId: 20,
      });

      expect(res.providerId).toBe(1);
      expect(res.availability).toHaveLength(1);
      const daySlots = res.availability[0].slots;
      // 09:00-10:00 overlaps blocked (09:30-10:30), 09:30-10:30 overlaps, 10:00-11:00 overlaps
      // 10:30-11:30 and 11:00-12:00 fit
      const hasOverlap = daySlots.some(
        (s) => s.startAt === '2026-10-25T09:30:00.000Z',
      );
      expect(hasOverlap).toBe(false);
    });
  });
});
