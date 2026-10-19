import { Test, TestingModule } from '@nestjs/testing';
import { BookingHoldsService } from './booking-holds.service.js';
import { db } from '../prisma/db.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

describe('BookingHoldsService', () => {
  let service: BookingHoldsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BookingHoldsService],
    }).compile();

    service = module.get<BookingHoldsService>(BookingHoldsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createHold', () => {
    it('should throw NotFoundException if service does not exist', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.createHold(18, {
          serviceId: 999,
          startAt: '2026-10-25T10:00:00.000Z',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if service is inactive', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          status: 'INACTIVE',
          category: { isActive: true },
          provider: { status: 'ACTIVE' },
        }),
      } as any);

      await expect(
        service.createHold(18, {
          serviceId: 1,
          startAt: '2026-10-25T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if provider is not approved', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          providerId: 10,
          status: 'ACTIVE',
          category: { isActive: true },
          provider: { status: 'ACTIVE' },
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.createHold(18, {
          serviceId: 1,
          startAt: '2026-10-25T10:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if requested slot is outside provider availability', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          providerId: 10,
          durationMinutes: 60,
          status: 'ACTIVE',
          category: { isActive: true },
          provider: { status: 'ACTIVE', timezone: 'UTC' },
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      // Sunday 2026-10-25 09:00 - 12:00
      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            dayOfWeek: 'SUNDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('12:00:00'),
          },
        ]),
      } as any);

      // Slot requested at 14:00 (outside working hours)
      await expect(
        service.createHold(18, {
          serviceId: 1,
          startAt: '2026-10-25T14:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if requested slot is blocked by provider', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Home Cleaning',
          providerId: 10,
          durationMinutes: 60,
          status: 'ACTIVE',
          category: { isActive: true },
          provider: { displayName: 'Pro 10', status: 'ACTIVE', timezone: 'UTC' },
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      // Sunday 09:00 - 17:00
      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            dayOfWeek: 'SUNDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('17:00:00'),
          },
        ]),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderProfile: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({ id: 10 }),
              }),
            },
            BlockedSlot: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([
                  {
                    id: 1,
                    startAt: new Date('2026-10-25T09:30:00.000Z'),
                    endAt: new Date('2026-10-25T11:00:00.000Z'),
                  },
                ]),
              }),
            },
            Booking: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
            },
            BookingHold: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      await expect(
        service.createHold(18, {
          serviceId: 1,
          startAt: '2026-10-25T10:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if requested slot is already held by another active hold', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Home Cleaning',
          providerId: 10,
          durationMinutes: 60,
          status: 'ACTIVE',
          category: { isActive: true },
          provider: { displayName: 'Pro 10', status: 'ACTIVE', timezone: 'UTC' },
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            dayOfWeek: 'SUNDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('17:00:00'),
          },
        ]),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderProfile: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({ id: 10 }),
              }),
            },
            BlockedSlot: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
            },
            Booking: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
            },
            BookingHold: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([
                  {
                    id: 99,
                    customerId: 44,
                    status: 'ACTIVE',
                    startAt: new Date('2026-10-25T10:00:00.000Z'),
                    endAt: new Date('2026-10-25T11:00:00.000Z'),
                    createdAt: new Date(), // Created just now
                    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
                  },
                ]),
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      await expect(
        service.createHold(18, {
          serviceId: 1,
          startAt: '2026-10-25T10:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create booking hold successfully with exclusive provider lock and valid expiry', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          name: 'Home Cleaning',
          providerId: 10,
          durationMinutes: 60,
          status: 'ACTIVE',
          category: { isActive: true },
          provider: { displayName: 'Pro 10', status: 'ACTIVE', timezone: 'UTC' },
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Availability, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            dayOfWeek: 'SUNDAY',
            startTime: Temporal.PlainTime.from('09:00:00'),
            endTime: Temporal.PlainTime.from('17:00:00'),
          },
        ]),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderProfile: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({ id: 10 }),
              }),
            },
            BlockedSlot: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
            },
            Booking: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
            },
            BookingHold: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
              create: jest.fn().mockResolvedValue({
                id: 105,
                providerId: 10,
                serviceId: 1,
                customerId: 18,
                status: 'ACTIVE',
                startAt: new Date('2026-10-25T10:00:00.000Z'),
                endAt: new Date('2026-10-25T11:00:00.000Z'),
                expiresAt: new Date('2026-10-25T11:15:00.000Z'),
                createdAt: new Date(),
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      const res = await service.createHold(18, {
        serviceId: 1,
        startAt: '2026-10-25T10:00:00.000Z',
      });

      expect(res.id).toBe(105);
      expect(res.status).toBe('ACTIVE');
      expect(res.holdTimeoutMinutes).toBe(15);
      expect(mockTx.orm.public.ProviderProfile.where).toHaveBeenCalledWith({ id: 10 });
    });
  });

  describe('releaseHold', () => {
    it('should throw ForbiddenException if hold does not belong to customer', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 10,
          customerId: 99,
          status: 'ACTIVE',
        }),
      } as any);

      await expect(service.releaseHold(10, 18)).rejects.toThrow(ForbiddenException);
    });

    it('should release hold successfully when owned by customer', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 10,
          customerId: 18,
          status: 'ACTIVE',
        }),
        update: jest.fn().mockResolvedValue({
          id: 10,
          status: 'RELEASED',
        }),
      } as any);

      const res = await service.releaseHold(10, 18);
      expect(res.status).toBe('RELEASED');
      expect(res.message).toContain('released successfully');
    });
  });
});
