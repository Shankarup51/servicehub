import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from './bookings.controller.js';
import { BookingsService } from './bookings.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;

  const mockBookingsService = {
    createBooking: jest.fn(),
    getCustomerBookings: jest.fn(),
    getBookingById: jest.fn(),
    getProviderBookings: jest.fn(),
    getProviderBookingById: jest.fn(),
    updateBookingStatus: jest.fn(),
    cancelBooking: jest.fn(),
  };

  const mockReq = {
    user: {
      userId: 5,
      email: 'customer@servicehub.test',
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingsController>(BookingsController);
    service = module.get<BookingsService>(BookingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate createBooking to service', async () => {
    const dto = {
      bookingHoldId: 1,
      location: {
        address: '123 St',
        city: 'City',
        area: 'Area',
        pinCode: '12345',
      },
    };
    mockBookingsService.createBooking.mockResolvedValue({ id: 10 });

    const result = await controller.createBooking(mockReq, dto);
    expect(result).toEqual({ id: 10 });
    expect(mockBookingsService.createBooking).toHaveBeenCalledWith(5, dto);
  });

  it('should delegate listBookings and getCustomerBookings to service', async () => {
    mockBookingsService.getCustomerBookings.mockResolvedValue({ items: [], total: 0 });

    await controller.listBookings(mockReq, { page: 1, limit: 10 });
    expect(mockBookingsService.getCustomerBookings).toHaveBeenCalledWith(5, { page: 1, limit: 10 });

    await controller.getCustomerBookings(mockReq, { page: 1, limit: 10 });
    expect(mockBookingsService.getCustomerBookings).toHaveBeenCalledWith(5, { page: 1, limit: 10 });
  });

  it('should delegate getProviderBookings to service', async () => {
    mockBookingsService.getProviderBookings.mockResolvedValue({ items: [], total: 0 });

    await controller.getProviderBookings(mockReq, { page: 1, limit: 10 });
    expect(mockBookingsService.getProviderBookings).toHaveBeenCalledWith(5, { page: 1, limit: 10 });
  });

  it('should delegate getProviderBookingById to service', async () => {
    mockBookingsService.getProviderBookingById.mockResolvedValue({ id: 42 });

    await controller.getProviderBookingById(mockReq, 42);
    expect(mockBookingsService.getProviderBookingById).toHaveBeenCalledWith(5, 42);
  });

  it('should delegate getBookingById to service', async () => {
    mockBookingsService.getBookingById.mockResolvedValue({ id: 42 });

    await controller.getBookingById(mockReq, 42);
    expect(mockBookingsService.getBookingById).toHaveBeenCalledWith(42, 5);
  });

  it('should delegate updateBookingStatus to service', async () => {
    const dto = { status: 'CONFIRMED' as const };
    mockBookingsService.updateBookingStatus.mockResolvedValue({ id: 42, status: 'CONFIRMED' });

    await controller.updateBookingStatus(mockReq, 42, dto);
    expect(mockBookingsService.updateBookingStatus).toHaveBeenCalledWith(42, 5, dto);
  });

  it('should delegate cancelBooking to service', async () => {
    const dto = { reason: 'CHANGE_OF_PLANS' };
    mockBookingsService.cancelBooking.mockResolvedValue({ id: 42, status: 'CANCELLED' });

    await controller.cancelBooking(mockReq, 42, dto);
    expect(mockBookingsService.cancelBooking).toHaveBeenCalledWith(42, 5, dto);
  });
});
