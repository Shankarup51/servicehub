import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service.js';
import { db } from '../prisma/db.js';
import { PermissionsService } from '../auth/permissions.service.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Temporal } from 'temporal-polyfill';

describe('BookingsService', () => {
  let service: BookingsService;
  let permissionsService: PermissionsService;

  const mockPermissionsService = {
    getUserRolesAndPermissions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
    permissionsService = module.get<PermissionsService>(PermissionsService);
    jest.clearAllMocks();

    // Default transaction mock executes callback directly with db.orm
    jest.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
      return callback({
        orm: db.orm,
      });
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    const validDto = {
      bookingHoldId: 10,
      customerNote: 'Please arrive on time',
      location: {
        label: 'Home',
        address: '123 Main St',
        city: 'Metropolis',
        area: 'Downtown',
        pinCode: '10001',
      },
    };

    const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const futureEndDate = new Date(futureDate.getTime() + 60 * 60 * 1000);
    const unexpiredDate = new Date(Date.now() + 10 * 60 * 1000);

    const activeHold = {
      id: 10,
      customerId: 5,
      providerId: 2,
      serviceId: 1,
      bookingId: null,
      status: 'ACTIVE',
      startAt: Temporal.Instant.from(futureDate.toISOString()),
      endAt: Temporal.Instant.from(futureEndDate.toISOString()),
      expiresAt: Temporal.Instant.from(unexpiredDate.toISOString()),
      createdAt: Temporal.Instant.from(new Date().toISOString()),
    };

    const mockService = {
      id: 1,
      name: 'Deep House Cleaning',
      price: '150.00',
      durationMinutes: 60,
      status: 'ACTIVE',
      category: { id: 3, name: 'Cleaning', isActive: true },
      provider: { id: 2, displayName: 'Pro Cleaners', status: 'ACTIVE' },
    };

    it('should successfully create a booking from a valid active hold', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(activeHold),
        update: jest.fn().mockResolvedValue({ ...activeHold, status: 'RELEASED', bookingId: 100 }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        update: jest.fn().mockResolvedValue({ id: 2 }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      const createdBooking = {
        id: 100,
        customerId: 5,
        providerId: 2,
        serviceId: 1,
        serviceName: 'Deep House Cleaning',
        servicePrice: '150.00',
        serviceDurationMinutes: 60,
        discountAmount: '0.00',
        finalAmount: '150.00',
        startAt: activeHold.startAt,
        endAt: activeHold.endAt,
        status: 'PENDING',
        customerNote: 'Please arrive on time',
        providerNote: null,
        createdAt: Temporal.Instant.from(new Date().toISOString()),
        updatedAt: Temporal.Instant.from(new Date().toISOString()),
      };

      jest.spyOn(db.orm.public.Booking, 'create').mockResolvedValue(createdBooking as any);
      jest.spyOn(db.orm.public.ServiceLocation, 'create').mockResolvedValue({
        id: 50,
        bookingId: 100,
        ...validDto.location,
      } as any);
      jest.spyOn(db.orm.public.BookingStatusHistory, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.createBooking(5, validDto);

      expect(result).toBeDefined();
      expect(result.id).toBe(100);
      expect(result.status).toBe('PENDING');
      expect(result.servicePrice).toBe(150);
      expect(result.serviceDurationMinutes).toBe(60);
      expect(result.location!.address).toBe('123 Main St');
      expect(db.orm.public.Booking.create).toHaveBeenCalled();
      expect(db.orm.public.ServiceLocation.create).toHaveBeenCalled();
      expect(db.orm.public.BookingStatusHistory.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if hold does not exist', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if hold belongs to another customer', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...activeHold, customerId: 999 }),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ConflictException if hold was already consumed', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...activeHold, bookingId: 42 }),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if hold is expired', async () => {
      const pastExpiry = new Date(Date.now() - 5 * 60 * 1000);
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          ...activeHold,
          expiresAt: Temporal.Instant.from(pastExpiry.toISOString()),
        }),
        update: jest.fn().mockResolvedValue({}),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if service is inactive', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(activeHold),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ ...mockService, status: 'INACTIVE' }),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if provider is not approved', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(activeHold),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if concurrent booking conflicts with slot', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(activeHold),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        update: jest.fn().mockResolvedValue({ id: 2 }),
      } as any);

      // Overlapping existing booking
      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          {
            id: 99,
            status: 'CONFIRMED',
            startAt: activeHold.startAt,
            endAt: activeHold.endAt,
          },
        ]),
      } as any);

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rollback transaction if booking write fails', async () => {
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(activeHold),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        update: jest.fn().mockResolvedValue({ id: 2 }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'create').mockRejectedValue(
        new Error('Database disk error'),
      );

      await expect(service.createBooking(5, validDto)).rejects.toThrow(
        'Database disk error',
      );
    });
  });

  describe('Customer access', () => {
    it('should list only bookings belonging to customer with pagination', async () => {
      const mockBookings = [
        {
          id: 1,
          customerId: 5,
          status: 'PENDING',
          servicePrice: '100.00',
          finalAmount: '100.00',
          createdAt: Temporal.Instant.from(new Date().toISOString()),
        },
        {
          id: 2,
          customerId: 5,
          status: 'CONFIRMED',
          servicePrice: '200.00',
          finalAmount: '200.00',
          createdAt: Temporal.Instant.from(new Date().toISOString()),
        },
      ];

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue(mockBookings),
      } as any);

      const result = await service.getCustomerBookings(5, { page: 1, limit: 10 });
      expect(result.items.length).toBe(2);
      expect(result.total).toBe(2);
    });

    it('should filter customer bookings by status', async () => {
      const mockBookings = [
        {
          id: 1,
          customerId: 5,
          status: 'PENDING',
          servicePrice: '100.00',
          finalAmount: '100.00',
          createdAt: Temporal.Instant.from(new Date().toISOString()),
        },
        {
          id: 2,
          customerId: 5,
          status: 'CONFIRMED',
          servicePrice: '200.00',
          finalAmount: '200.00',
          createdAt: Temporal.Instant.from(new Date().toISOString()),
        },
      ];

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue(mockBookings),
      } as any);

      const result = await service.getCustomerBookings(5, { status: 'CONFIRMED' });
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe(2);
    });

    it('should allow customer to access their own booking detail', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:read']),
      });

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          customerId: 5,
          status: 'PENDING',
          servicePrice: '100.00',
          finalAmount: '100.00',
          provider: { userId: 10 },
        }),
      } as any);

      jest.spyOn(db.orm.public.BookingStatusHistory, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.getBookingById(1, 5);
      expect(result.id).toBe(1);
    });

    it('should deny customer access to another customers booking', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:read']),
      });

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          customerId: 999, // Another customer
          status: 'PENDING',
          provider: { userId: 10 },
        }),
      } as any);

      await expect(service.getBookingById(1, 5)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Provider access', () => {
    it('should list bookings assigned to the authenticated provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, userId: 10 }),
      } as any);

      const assignedBookings = [
        {
          id: 1,
          providerId: 2,
          status: 'PENDING',
          servicePrice: '100.00',
          finalAmount: '100.00',
          startAt: Temporal.Instant.from(new Date().toISOString()),
        },
      ];

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue(assignedBookings),
      } as any);

      const result = await service.getProviderBookings(10, { page: 1, limit: 10 });
      expect(result.items.length).toBe(1);
      expect(result.items[0].id).toBe(1);
    });

    it('should throw ForbiddenException if user is not a provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.getProviderBookings(99, { page: 1, limit: 10 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should prevent an unassigned provider from viewing another providers booking', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, userId: 10 }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          providerId: 999, // Assigned to different provider
        }),
      } as any);

      await expect(service.getProviderBookingById(10, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('Status transitions', () => {
    it('should allow valid transition PENDING -> CONFIRMED by assigned provider', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['SERVICE_PROVIDER'],
        permissions: new Set(['bookings:update']),
      });

      const existingBooking = {
        id: 1,
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
        update: jest.fn().mockResolvedValue({ ...existingBooking, status: 'CONFIRMED' }),
      } as any);

      jest.spyOn(db.orm.public.BookingStatusHistory, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.updateBookingStatus(1, 10, { status: 'CONFIRMED' });
      expect(result.status).toBe('CONFIRMED');
      expect(db.orm.public.BookingStatusHistory.create).toHaveBeenCalled();
    });

    it('should allow valid transition CONFIRMED -> IN_PROGRESS by assigned provider', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['SERVICE_PROVIDER'],
        permissions: new Set(['bookings:update']),
      });

      const existingBooking = {
        id: 1,
        status: 'CONFIRMED',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
        update: jest.fn().mockResolvedValue({ ...existingBooking, status: 'IN_PROGRESS' }),
      } as any);

      jest.spyOn(db.orm.public.BookingStatusHistory, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.updateBookingStatus(1, 10, { status: 'IN_PROGRESS' });
      expect(result.status).toBe('IN_PROGRESS');
    });

    it('should allow valid transition IN_PROGRESS -> COMPLETED by assigned provider', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['SERVICE_PROVIDER'],
        permissions: new Set(['bookings:update']),
      });

      const existingBooking = {
        id: 1,
        status: 'IN_PROGRESS',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
        update: jest.fn().mockResolvedValue({ ...existingBooking, status: 'COMPLETED' }),
      } as any);

      jest.spyOn(db.orm.public.BookingStatusHistory, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.updateBookingStatus(1, 10, { status: 'COMPLETED' });
      expect(result.status).toBe('COMPLETED');
    });

    it('should reject invalid transition PENDING -> COMPLETED with BadRequestException', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['SERVICE_PROVIDER'],
        permissions: new Set(['bookings:update']),
      });

      const existingBooking = {
        id: 1,
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
      } as any);

      await expect(
        service.updateBookingStatus(1, 10, { status: 'COMPLETED' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unauthorized customer attempting to update booking status', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:read']),
      });

      const existingBooking = {
        id: 1,
        customerId: 5,
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
      } as any);

      await expect(
        service.updateBookingStatus(1, 5, { status: 'CONFIRMED' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException on concurrent status change during update', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['SERVICE_PROVIDER'],
        permissions: new Set(['bookings:update']),
      });

      const initialBooking = {
        id: 1,
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      let callCount = 0;
      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockImplementation(async () => {
          callCount++;
          if (callCount === 1) return initialBooking;
          // Concurrently updated by another process
          return { ...initialBooking, status: 'CANCELLED' };
        }),
      } as any);

      await expect(
        service.updateBookingStatus(1, 10, { status: 'CONFIRMED' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Cancellation', () => {
    it('should allow customer owner to cancel a PENDING booking', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:cancel']),
      });

      const existingBooking = {
        id: 1,
        customerId: 5,
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
        update: jest.fn().mockResolvedValue({ ...existingBooking, status: 'CANCELLED' }),
      } as any);

      jest.spyOn(db.orm.public.Cancellation, 'create').mockResolvedValue({
        id: 10,
        bookingId: 1,
        cancelledBy: 'CUSTOMER',
        reasonCode: 'CHANGE_OF_PLANS',
      } as any);

      jest.spyOn(db.orm.public.BookingStatusHistory, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.cancelBooking(1, 5, {
        reason: 'CHANGE_OF_PLANS',
        explanation: 'Customer changed plans',
      });

      expect(result.status).toBe('CANCELLED');
      expect(result.cancellation!.cancelledBy).toBe('CUSTOMER');
      expect(db.orm.public.Cancellation.create).toHaveBeenCalled();
      expect(db.orm.public.BookingStatusHistory.create).toHaveBeenCalled();
    });

    it('should allow assigned provider to cancel a CONFIRMED booking', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['SERVICE_PROVIDER'],
        permissions: new Set(['bookings:update']),
      });

      const existingBooking = {
        id: 1,
        customerId: 5,
        status: 'CONFIRMED',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
        update: jest.fn().mockResolvedValue({ ...existingBooking, status: 'CANCELLED' }),
      } as any);

      jest.spyOn(db.orm.public.Cancellation, 'create').mockResolvedValue({
        id: 11,
        bookingId: 1,
        cancelledBy: 'PROVIDER',
        reasonCode: 'EQUIPMENT_FAILURE',
      } as any);

      jest.spyOn(db.orm.public.BookingStatusHistory, 'create').mockResolvedValue({ id: 1 } as any);

      const result = await service.cancelBooking(1, 10, {
        reason: 'EQUIPMENT_FAILURE',
      });

      expect(result.status).toBe('CANCELLED');
      expect(result.cancellation!.cancelledBy).toBe('PROVIDER');
    });

    it('should reject cancellation from unauthorized participant', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:cancel']),
      });

      const existingBooking = {
        id: 1,
        customerId: 999, // Different customer
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
      } as any);

      await expect(
        service.cancelBooking(1, 5, { reason: 'UNAUTHORIZED_ATTEMPT' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should reject cancellation if booking is already CANCELLED', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:cancel']),
      });

      const existingBooking = {
        id: 1,
        customerId: 5,
        status: 'CANCELLED',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
      } as any);

      await expect(
        service.cancelBooking(1, 5, { reason: 'DOUBLE_CANCEL' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject cancellation if booking is IN_PROGRESS or COMPLETED', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:cancel']),
      });

      const existingBooking = {
        id: 1,
        customerId: 5,
        status: 'IN_PROGRESS',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
      } as any);

      await expect(
        service.cancelBooking(1, 5, { reason: 'TOO_LATE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should rollback transaction if cancellation write fails', async () => {
      mockPermissionsService.getUserRolesAndPermissions.mockResolvedValue({
        roles: ['CUSTOMER'],
        permissions: new Set(['bookings:cancel']),
      });

      const existingBooking = {
        id: 1,
        customerId: 5,
        status: 'PENDING',
        provider: { id: 2, userId: 10 },
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(existingBooking),
        update: jest.fn().mockResolvedValue({ ...existingBooking, status: 'CANCELLED' }),
      } as any);

      jest.spyOn(db.orm.public.Cancellation, 'create').mockRejectedValue(
        new Error('Cancellation insert failed'),
      );

      await expect(
        service.cancelBooking(1, 5, { reason: 'FAILED_OPERATION' }),
      ).rejects.toThrow('Cancellation insert failed');
    });
  });

  describe('getCustomerBookings', () => {
    const mockBookingRaw = {
      id: 101,
      customerId: 5,
      providerId: 2,
      serviceId: 1,
      serviceName: 'House Deep Cleaning',
      servicePrice: '150.00',
      serviceDurationMinutes: 60,
      discountAmount: '0.00',
      finalAmount: '150.00',
      startAt: Temporal.Instant.from(new Date().toISOString()),
      endAt: Temporal.Instant.from(new Date().toISOString()),
      status: 'CONFIRMED',
      customerNote: 'Notes',
      providerNote: null,
      createdAt: Temporal.Instant.from(new Date().toISOString()),
      updatedAt: Temporal.Instant.from(new Date().toISOString()),
    };

    it('should enforce customer ownership and filter by status in query builder', async () => {
      const whereClauses: any[] = [];
      const mockQb: any = {
        where: jest.fn().mockImplementation((predicate: any) => {
          whereClauses.push(predicate);
          return mockQb;
        }),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockBookingRaw]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      const result = await service.getCustomerBookings(5, {
        status: 'CONFIRMED',
        page: 1,
        limit: 10,
      });

      expect(mockQb.where).toHaveBeenCalled();
      expect(mockQb.aggregate).toHaveBeenCalled();

      // Assert ownership and status in predicates
      const columnSpy = {
        customerId: { eq: jest.fn() },
        status: { eq: jest.fn() },
      };
      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });

      expect(columnSpy.customerId.eq).toHaveBeenCalledWith(5);
      expect(columnSpy.status.eq).toHaveBeenCalledWith('CONFIRMED');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by timeframe UPCOMING using startAt.gte', async () => {
      const whereClauses: any[] = [];
      const mockQb: any = {
        where: jest.fn().mockImplementation((predicate: any) => {
          whereClauses.push(predicate);
          return mockQb;
        }),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockBookingRaw]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      await service.getCustomerBookings(5, { timeframe: 'UPCOMING' });

      const columnSpy = {
        customerId: { eq: jest.fn() },
        startAt: { gte: jest.fn() },
      };
      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });
      expect(columnSpy.startAt.gte).toHaveBeenCalled();
    });

    it('should filter by timeframe PAST using startAt.lt', async () => {
      const whereClauses: any[] = [];
      const mockQb: any = {
        where: jest.fn().mockImplementation((predicate: any) => {
          whereClauses.push(predicate);
          return mockQb;
        }),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockBookingRaw]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      await service.getCustomerBookings(5, { timeframe: 'PAST' });

      const columnSpy = {
        customerId: { eq: jest.fn() },
        startAt: { lt: jest.fn() },
      };
      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });
      expect(columnSpy.startAt.lt).toHaveBeenCalled();
    });

    it('should escape ILIKE special wildcard characters (%, _, \\) in customer booking search', async () => {
      const whereClauses: any[] = [];
      const mockQb: any = {
        where: jest.fn().mockImplementation((predicate: any) => {
          whereClauses.push(predicate);
          return mockQb;
        }),
        aggregate: jest.fn().mockResolvedValue({ total: 0 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      let providerWhereCall: any = null;
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockImplementation((pred: any) => {
        providerWhereCall = pred;
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue([{ id: 2 }]),
          }),
        } as any;
      });

      await service.getCustomerBookings(5, { search: '20%_off\\order' });

      const providerColSpy = {
        displayName: { ilike: jest.fn() },
      };
      if (typeof providerWhereCall === 'function') {
        providerWhereCall(providerColSpy);
      }
      expect(providerColSpy.displayName.ilike).toHaveBeenCalledWith('%20\\%\\_off\\\\order%');
    });

    it('should support numeric booking ID in search filter', async () => {
      const whereClauses: any[] = [];
      const mockQb: any = {
        where: jest.fn().mockImplementation((predicate: any) => {
          whereClauses.push(predicate);
          return mockQb;
        }),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockBookingRaw]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        select: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      await service.getCustomerBookings(5, { search: '101' });

      const columnSpy = {
        customerId: { eq: jest.fn() },
        id: { eq: jest.fn() },
        serviceName: { ilike: jest.fn() },
        customerNote: { ilike: jest.fn() },
      };

      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });

      expect(columnSpy.id.eq).toHaveBeenCalledWith(101);
    });

    it('should apply sorting by startAt ascending with id tie-breaker', async () => {
      let capturedOrderBy: any = null;
      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockImplementation((order: any) => {
          capturedOrderBy = order;
          return mockQb;
        }),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockBookingRaw]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue(mockQb);

      await service.getCustomerBookings(5, {
        sortBy: 'startAt',
        sortOrder: 'asc',
      });

      expect(mockQb.orderBy).toHaveBeenCalled();
      expect(Array.isArray(capturedOrderBy)).toBe(true);
      const columnSpy = {
        startAt: { asc: jest.fn() },
        id: { desc: jest.fn() },
      };
      capturedOrderBy[0](columnSpy);
      capturedOrderBy[1](columnSpy);
      expect(columnSpy.startAt.asc).toHaveBeenCalled();
      expect(columnSpy.id.desc).toHaveBeenCalled();
    });

    it('should apply pagination limit and offset correctly and compute totalPages', async () => {
      let capturedLimit = 0;
      let capturedOffset = 0;
      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 25 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation((l: number) => {
          capturedLimit = l;
          return mockQb;
        }),
        offset: jest.fn().mockImplementation((o: number) => {
          capturedOffset = o;
          return mockQb;
        }),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockBookingRaw]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue(mockQb);

      const result = await service.getCustomerBookings(5, {
        page: 2,
        limit: 10,
      });

      expect(capturedLimit).toBe(10);
      expect(capturedOffset).toBe(10); // (page 2 - 1) * 10 = 10
      expect(result.total).toBe(25);
      expect(result.totalPages).toBe(3); // Math.ceil(25 / 10) = 3
    });
  });

  describe('getProviderBookings', () => {
    const mockProviderBooking = {
      id: 201,
      customerId: 10,
      providerId: 2,
      serviceId: 1,
      serviceName: 'Appliance Repair',
      servicePrice: '200.00',
      serviceDurationMinutes: 60,
      discountAmount: '0.00',
      finalAmount: '200.00',
      startAt: Temporal.Instant.from(new Date().toISOString()),
      endAt: Temporal.Instant.from(new Date().toISOString()),
      status: 'PENDING',
      customerNote: null,
      providerNote: null,
      createdAt: Temporal.Instant.from(new Date().toISOString()),
      updatedAt: Temporal.Instant.from(new Date().toISOString()),
    };

    it('should throw ForbiddenException if user has no provider profile', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getProviderBookings(999, {})).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should enforce provider ownership and apply query filters', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, userId: 10 }),
      } as any);

      const whereClauses: any[] = [];
      const mockQb: any = {
        where: jest.fn().mockImplementation((predicate: any) => {
          whereClauses.push(predicate);
          return mockQb;
        }),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockProviderBooking]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      const result = await service.getProviderBookings(10, {
        status: 'PENDING',
        page: 1,
        limit: 10,
      });

      expect(mockQb.where).toHaveBeenCalled();
      const columnSpy = {
        providerId: { eq: jest.fn() },
        status: { eq: jest.fn() },
      };
      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });
      expect(columnSpy.providerId.eq).toHaveBeenCalledWith(2);
      expect(columnSpy.status.eq).toHaveBeenCalledWith('PENDING');
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should escape ILIKE special wildcard characters in provider booking search', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, userId: 10 }),
      } as any);

      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 0 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue(mockQb);

      let userWhereCall: any = null;
      jest.spyOn(db.orm.public.User, 'where').mockImplementation((pred: any) => {
        userWhereCall = pred;
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue([{ id: 5 }]),
          }),
        } as any;
      });

      await service.getProviderBookings(10, { search: 'cust%_\\special' });

      const userColSpy = {
        firstName: { ilike: jest.fn() },
        lastName: { ilike: jest.fn() },
        email: { ilike: jest.fn() },
        phone: { ilike: jest.fn() },
      };
      if (typeof userWhereCall === 'function') {
        userWhereCall(userColSpy);
      }
      expect(userColSpy.firstName.ilike).toHaveBeenCalledWith('%cust\\%\\_\\\\special%');
    });

    it('should return empty items and total 0 when no bookings match query', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, userId: 10 }),
      } as any);

      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 0 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue(mockQb);

      const result = await service.getProviderBookings(10, {
        status: 'EXPIRED',
      });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });
  });
});
