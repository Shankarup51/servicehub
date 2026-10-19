import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityController } from './availability.controller.js';
import { AvailabilityService } from './availability.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { DayOfWeekEnum } from './dto/create-availability.dto.js';

describe('AvailabilityController', () => {
  let controller: AvailabilityController;
  let service: jest.Mocked<AvailabilityService>;

  const mockUserReq: any = {
    user: {
      userId: 10,
      email: 'provider@example.com',
    },
  };

  beforeEach(async () => {
    const mockService = {
      getOwnAvailability: jest.fn(),
      addAvailability: jest.fn(),
      deleteAvailability: jest.fn(),
      getOwnBlockedSlots: jest.fn(),
      createBlockedSlot: jest.fn(),
      updateBlockedSlot: jest.fn(),
      deleteBlockedSlot: jest.fn(),
      getPublicAvailability: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AvailabilityController],
      providers: [
        {
          provide: AvailabilityService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AvailabilityController>(AvailabilityController);
    service = module.get(AvailabilityService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('getOwnAvailability should call service', async () => {
    service.getOwnAvailability.mockResolvedValue([{ id: 1 } as any]);
    const res = await controller.getOwnAvailability(mockUserReq);
    expect(service.getOwnAvailability).toHaveBeenCalledWith(10);
    expect(res).toEqual([{ id: 1 }]);
  });

  it('addAvailability should call service', async () => {
    const dto = { dayOfWeek: DayOfWeekEnum.MONDAY, startTime: '09:00', endTime: '17:00' };
    service.addAvailability.mockResolvedValue({ id: 1, ...dto } as any);
    const res = await controller.addAvailability(mockUserReq, dto);
    expect(service.addAvailability).toHaveBeenCalledWith(10, dto);
    expect(res.id).toBe(1);
  });

  it('deleteAvailability should call service', async () => {
    service.deleteAvailability.mockResolvedValue({ message: 'deleted' } as any);
    const res = await controller.deleteAvailability(1, mockUserReq);
    expect(service.deleteAvailability).toHaveBeenCalledWith(1, 10);
    expect(res.message).toBe('deleted');
  });

  it('blocked slot endpoints should call service', async () => {
    service.getOwnBlockedSlots.mockResolvedValue([{ id: 2 }] as any);
    await controller.getOwnBlockedSlots(mockUserReq);
    expect(service.getOwnBlockedSlots).toHaveBeenCalledWith(10);

    const createDto = { startAt: '2026-10-25T10:00:00Z', endAt: '2026-10-25T12:00:00Z', reason: 'Break' };
    service.createBlockedSlot.mockResolvedValue({ id: 2 } as any);
    await controller.createBlockedSlot(mockUserReq, createDto);
    expect(service.createBlockedSlot).toHaveBeenCalledWith(10, createDto);

    const updateDto = { reason: 'Updated break' };
    service.updateBlockedSlot.mockResolvedValue({ id: 2 } as any);
    await controller.updateBlockedSlot(2, mockUserReq, updateDto);
    expect(service.updateBlockedSlot).toHaveBeenCalledWith(2, 10, updateDto);

    service.deleteBlockedSlot.mockResolvedValue({ message: 'deleted' } as any);
    await controller.deleteBlockedSlot(2, mockUserReq);
    expect(service.deleteBlockedSlot).toHaveBeenCalledWith(2, 10);
  });

  it('getPublicAvailability should call service', async () => {
    service.getPublicAvailability.mockResolvedValue({ providerId: 1, availability: [] } as any);
    const query = { date: '2026-10-25' };
    const res = await controller.getPublicAvailability(1, query);
    expect(service.getPublicAvailability).toHaveBeenCalledWith(1, query);
    expect(res.providerId).toBe(1);
  });
});
