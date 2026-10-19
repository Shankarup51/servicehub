import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersController } from './providers.controller.js';
import { AdminVerificationsController } from './admin-verifications.controller.js';
import { ProvidersService } from './providers.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { PermissionsGuard } from '../auth/guards/permissions.guard.js';
import { QueryVerificationsDto } from './dto/query-verifications.dto.js';
import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('ProvidersController & AdminVerificationsController', () => {
  let providersController: ProvidersController;
  let adminController: AdminVerificationsController;
  let providersService: jest.Mocked<ProvidersService>;

  const mockUserReq: any = {
    user: {
      userId: 10,
      email: 'provider@example.com',
    },
  };

  const mockAdminReq: any = {
    user: {
      userId: 99,
      email: 'admin@example.com',
    },
  };

  beforeEach(async () => {
    const mockServiceMethods = {
      createProfile: jest.fn(),
      getOwnProfile: jest.fn(),
      updateOwnProfile: jest.fn(),
      getPublicProfile: jest.fn(),
      getOwnServiceAreas: jest.fn(),
      addServiceArea: jest.fn(),
      updateServiceArea: jest.fn(),
      deleteServiceArea: jest.fn(),
      getOwnVerification: jest.fn(),
      addVerificationDocument: jest.fn(),
      deleteVerificationDocument: jest.fn(),
      submitVerification: jest.fn(),
      adminListVerifications: jest.fn(),
      adminGetVerification: jest.fn(),
      adminApproveVerification: jest.fn(),
      adminRejectVerification: jest.fn(),
      onboard: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProvidersController, AdminVerificationsController],
      providers: [
        {
          provide: ProvidersService,
          useValue: mockServiceMethods,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    providersController = module.get<ProvidersController>(ProvidersController);
    adminController = module.get<AdminVerificationsController>(AdminVerificationsController);
    providersService = module.get(ProvidersService);
  });

  it('should controllers be defined', () => {
    expect(providersController).toBeDefined();
    expect(adminController).toBeDefined();
  });

  describe('ProvidersController', () => {
    it('onboard should forward to providersService.onboard', async () => {
      providersService.onboard.mockResolvedValue({ message: 'success' } as any);
      const dto = {
        displayName: 'New Provider',
        serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
        documents: [
          { documentType: 'ID_PROOF', storageKey: 'k', fileName: 'id.pdf', mimeType: 'application/pdf' },
        ],
      };
      const res = await providersController.onboard(mockUserReq, dto);
      expect(providersService.onboard).toHaveBeenCalledWith(10, dto);
      expect(res).toEqual({ message: 'success' });
    });

    it('apply should forward to providersService.onboard', async () => {
      providersService.onboard.mockResolvedValue({ message: 'success' } as any);
      const dto = {
        displayName: 'New Provider',
        serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
        documents: [
          { documentType: 'ID_PROOF', storageKey: 'k', fileName: 'id.pdf', mimeType: 'application/pdf' },
        ],
      };
      const res = await providersController.apply(mockUserReq, dto);
      expect(providersService.onboard).toHaveBeenCalledWith(10, dto);
      expect(res).toEqual({ message: 'success' });
    });

    it('createProfile should forward to providersService.createProfile', async () => {
      providersService.createProfile.mockResolvedValue({ id: 1 } as any);
      const dto = { displayName: 'Pro Services', timezone: 'Asia/Kolkata' };
      const res = await providersController.createProfile(mockUserReq, dto);
      expect(providersService.createProfile).toHaveBeenCalledWith(10, dto);
      expect(res).toEqual({ id: 1 });
    });

    it('getOwnProfile should forward to providersService.getOwnProfile', async () => {
      providersService.getOwnProfile.mockResolvedValue({ id: 1, displayName: 'Pro' } as any);
      const res = await providersController.getOwnProfile(mockUserReq);
      expect(providersService.getOwnProfile).toHaveBeenCalledWith(10);
      expect(res).toEqual({ id: 1, displayName: 'Pro' });
    });

    it('updateOwnProfile should forward to providersService.updateOwnProfile', async () => {
      providersService.updateOwnProfile.mockResolvedValue({ id: 1, displayName: 'Updated' } as any);
      const dto = { displayName: 'Updated' };
      const res = await providersController.updateOwnProfile(mockUserReq, dto);
      expect(providersService.updateOwnProfile).toHaveBeenCalledWith(10, dto);
      expect(res).toEqual({ id: 1, displayName: 'Updated' });
    });

    it('service area endpoints should route to service correctly', async () => {
      providersService.getOwnServiceAreas.mockResolvedValue([{ id: 1 }] as any);
      providersService.addServiceArea.mockResolvedValue({ id: 2 } as any);
      providersService.updateServiceArea.mockResolvedValue({ id: 2 } as any);
      providersService.deleteServiceArea.mockResolvedValue({ message: 'deleted' } as any);

      await providersController.getOwnServiceAreas(mockUserReq);
      expect(providersService.getOwnServiceAreas).toHaveBeenCalledWith(10);

      const addDto = { city: 'Mumbai', area: 'Bandra', pinCode: '400050' };
      await providersController.addServiceArea(mockUserReq, addDto);
      expect(providersService.addServiceArea).toHaveBeenCalledWith(10, addDto);

      const updateDto = { city: 'Mumbai', area: 'Khar' };
      await providersController.updateServiceArea(2, mockUserReq, updateDto);
      expect(providersService.updateServiceArea).toHaveBeenCalledWith(2, 10, updateDto);

      await providersController.deleteServiceArea(2, mockUserReq);
      expect(providersService.deleteServiceArea).toHaveBeenCalledWith(2, 10);
    });

    it('verification endpoints should route to service correctly', async () => {
      providersService.getOwnVerification.mockResolvedValue({ id: 100 } as any);
      providersService.addVerificationDocument.mockResolvedValue({ id: 5 } as any);
      providersService.deleteVerificationDocument.mockResolvedValue({ message: 'deleted' } as any);
      providersService.submitVerification.mockResolvedValue({ status: 'PENDING' } as any);

      await providersController.getOwnVerification(mockUserReq);
      expect(providersService.getOwnVerification).toHaveBeenCalledWith(10);

      const docDto = {
        documentType: 'ID_PROOF',
        storageKey: 'key/id.pdf',
        fileName: 'id.pdf',
        mimeType: 'application/pdf',
      };
      await providersController.addVerificationDocument(mockUserReq, docDto);
      expect(providersService.addVerificationDocument).toHaveBeenCalledWith(10, docDto);

      await providersController.deleteVerificationDocument(5, mockUserReq);
      expect(providersService.deleteVerificationDocument).toHaveBeenCalledWith(5, 10);

      await providersController.submitVerification(mockUserReq);
      expect(providersService.submitVerification).toHaveBeenCalledWith(10);
    });

    it('getPublicProfile should forward to providersService.getPublicProfile', async () => {
      providersService.getPublicProfile.mockResolvedValue({ id: 1, displayName: 'Public Pro' } as any);
      const res = await providersController.getPublicProfile(1);
      expect(providersService.getPublicProfile).toHaveBeenCalledWith(1);
      expect(res).toEqual({ id: 1, displayName: 'Public Pro' });
    });
  });

  describe('AdminVerificationsController', () => {
    it('findAll should forward query to providersService.adminListVerifications', async () => {
      providersService.adminListVerifications.mockResolvedValue({ data: [], meta: {} } as any);
      const query = { page: 1, limit: 10 };
      await adminController.findAll(query);
      expect(providersService.adminListVerifications).toHaveBeenCalledWith(query);
    });

    it('findOne should forward to providersService.adminGetVerification', async () => {
      providersService.adminGetVerification.mockResolvedValue({ id: 100 } as any);
      await adminController.findOne(100);
      expect(providersService.adminGetVerification).toHaveBeenCalledWith(100);
    });

    it('approve should pass reviewerUserId and id to providersService.adminApproveVerification', async () => {
      providersService.adminApproveVerification.mockResolvedValue({ status: 'APPROVED' } as any);
      await adminController.approve(100, mockAdminReq);
      expect(providersService.adminApproveVerification).toHaveBeenCalledWith(100, 99);
    });

    it('reject should pass reviewerUserId, id, and rejection dto to providersService.adminRejectVerification', async () => {
      providersService.adminRejectVerification.mockResolvedValue({ status: 'REJECTED' } as any);
      const dto = { rejectionReason: 'License expired' };
      await adminController.reject(100, mockAdminReq, dto);
      expect(providersService.adminRejectVerification).toHaveBeenCalledWith(100, 99, dto);
    });
  });

  describe('QueryVerificationsDto validation boundary', () => {
    const pipe = new ValidationPipe({ transform: true, whitelist: true });

    it('should have undefined status when status is omitted', async () => {
      const dto = plainToInstance(QueryVerificationsDto, {});
      expect(dto.status).toBeUndefined();
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid sortBy with validation error', async () => {
      const dto = plainToInstance(QueryVerificationsDto, { sortBy: 'unsupportedField' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'sortBy')).toBe(true);

      await expect(
        pipe.transform(
          { sortBy: 'unsupportedField' },
          { type: 'query', metatype: QueryVerificationsDto },
        ),
      ).rejects.toThrow();
    });

    it.each(['submittedAt', 'createdAt', 'id'] as const)(
      'should accept valid sortBy: %s',
      async (field) => {
        const dto = plainToInstance(QueryVerificationsDto, { sortBy: field });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'sortBy')).toBe(false);

        const transformed: QueryVerificationsDto = await pipe.transform(
          { sortBy: field },
          { type: 'query', metatype: QueryVerificationsDto },
        );
        expect(transformed.sortBy).toBe(field);
      },
    );

    it('should reject invalid sortOrder with validation error', async () => {
      const dto = plainToInstance(QueryVerificationsDto, { sortOrder: 'sideways' });
      const errors = await validate(dto);
      expect(errors.some((e) => e.property === 'sortOrder')).toBe(true);

      await expect(
        pipe.transform(
          { sortOrder: 'sideways' },
          { type: 'query', metatype: QueryVerificationsDto },
        ),
      ).rejects.toThrow();
    });

    it.each(['asc', 'desc'] as const)(
      'should accept valid sortOrder: %s',
      async (order) => {
        const dto = plainToInstance(QueryVerificationsDto, { sortOrder: order });
        const errors = await validate(dto);
        expect(errors.some((e) => e.property === 'sortOrder')).toBe(false);

        const transformed: QueryVerificationsDto = await pipe.transform(
          { sortOrder: order },
          { type: 'query', metatype: QueryVerificationsDto },
        );
        expect(transformed.sortOrder).toBe(order);
      },
    );
  });
});
