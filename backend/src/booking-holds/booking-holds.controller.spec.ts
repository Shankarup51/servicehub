import { Test, TestingModule } from '@nestjs/testing';
import { BookingHoldsController } from './booking-holds.controller.js';
import { BookingHoldsService } from './booking-holds.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';

describe('BookingHoldsController', () => {
  let controller: BookingHoldsController;
  let service: jest.Mocked<BookingHoldsService>;

  const mockCustomerReq: any = {
    user: {
      userId: 18,
      email: 'customer@example.com',
    },
  };

  beforeEach(async () => {
    const mockService = {
      createHold: jest.fn(),
      getCustomerActiveHold: jest.fn(),
      releaseHold: jest.fn(),
      cleanupExpiredHolds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingHoldsController],
      providers: [
        {
          provide: BookingHoldsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BookingHoldsController>(BookingHoldsController);
    service = module.get(BookingHoldsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('createHold should call service with customerId and dto', async () => {
    const dto = { serviceId: 1, startAt: '2026-10-25T10:00:00Z' };
    service.createHold.mockResolvedValue({ id: 10, status: 'ACTIVE' } as any);
    const res = await controller.createHold(mockCustomerReq, dto);
    expect(service.createHold).toHaveBeenCalledWith(18, dto);
    expect(res).toEqual({ id: 10, status: 'ACTIVE' });
  });

  it('getCustomerActiveHold should call service with customerId', async () => {
    service.getCustomerActiveHold.mockResolvedValue({ id: 10 } as any);
    const res = await controller.getCustomerActiveHold(mockCustomerReq);
    expect(service.getCustomerActiveHold).toHaveBeenCalledWith(18);
    expect(res).toEqual({ id: 10 });
  });

  it('releaseHold should call service with holdId and customerId', async () => {
    service.releaseHold.mockResolvedValue({ message: 'released', status: 'RELEASED' } as any);
    const res = await controller.releaseHold(10, mockCustomerReq);
    expect(service.releaseHold).toHaveBeenCalledWith(10, 18);
    expect(res.status).toBe('RELEASED');
  });

  it('releaseHoldPost should call service with holdId and customerId', async () => {
    service.releaseHold.mockResolvedValue({ message: 'released', status: 'RELEASED' } as any);
    const res = await controller.releaseHoldPost(10, mockCustomerReq);
    expect(service.releaseHold).toHaveBeenCalledWith(10, 18);
    expect(res.status).toBe('RELEASED');
  });
});
