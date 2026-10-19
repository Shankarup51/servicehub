import { Test, TestingModule } from '@nestjs/testing';
import { ServicesService } from './services.service.js';
import { db } from '../prisma/db.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ServiceStatusEnum } from './dto/create-service.dto.js';

describe('ServicesService', () => {
  let service: ServicesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServicesService],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should filter out services with inactive category, inactive parent category, or unapproved provider', async () => {
      const mockServices = [
        {
          id: 1,
          name: 'Valid Service',
          description: 'Valid clean',
          price: '500.00',
          durationMinutes: 60,
          status: 'ACTIVE',
          categoryId: 1,
          providerId: 10,
          category: { id: 1, name: 'Home', isActive: true, parentId: null },
          provider: {
            id: 10,
            displayName: 'Pro 10',
            bio: 'Bio',
            status: 'ACTIVE',
            timezone: 'UTC',
          },
          images: [],
        },
        {
          id: 2,
          name: 'Inactive Category Service',
          description: 'Invalid',
          price: '800.00',
          durationMinutes: 90,
          status: 'ACTIVE',
          categoryId: 2,
          providerId: 10,
          category: { id: 2, name: 'Old', isActive: false, parentId: null },
          provider: {
            id: 10,
            displayName: 'Pro 10',
            bio: 'Bio',
            status: 'ACTIVE',
            timezone: 'UTC',
          },
          images: [],
        },
        {
          id: 3,
          name: 'Unapproved Provider Service',
          description: 'Invalid',
          price: '900.00',
          durationMinutes: 60,
          status: 'ACTIVE',
          categoryId: 1,
          providerId: 20,
          category: { id: 1, name: 'Home', isActive: true, parentId: null },
          provider: {
            id: 20,
            displayName: 'Unapproved Pro',
            bio: 'Bio',
            status: 'ACTIVE',
            timezone: 'UTC',
          },
          images: [],
        },
        {
          id: 4,
          name: 'Inactive Parent Category Service',
          description: 'Child is active but parent is inactive',
          price: '600.00',
          durationMinutes: 60,
          status: 'ACTIVE',
          categoryId: 3,
          providerId: 10,
          category: { id: 3, name: 'Sub', isActive: true, parentId: 4 },
          provider: {
            id: 10,
            displayName: 'Pro 10',
            bio: 'Bio',
            status: 'ACTIVE',
            timezone: 'UTC',
          },
          images: [],
        },
      ];

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue(mockServices),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ providerId: 10, status: 'APPROVED' }]),
      } as any);

      jest.spyOn(db.orm.public.Category, 'all').mockResolvedValue([
        { id: 1, name: 'Home', isActive: true, parentId: null },
        { id: 2, name: 'Old', isActive: false, parentId: null },
        { id: 3, name: 'Sub', isActive: true, parentId: 4 },
        { id: 4, name: 'Inactive Root', isActive: false, parentId: null },
      ] as any);

      const result = await service.findAll({});
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should throw BadRequestException if categoryId is not a positive integer', async () => {
      await expect(service.findAll({ categoryId: -5 as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should return empty list if queried category does not exist or is inactive', async () => {
      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      const result = await service.findAll({ categoryId: 999 });
      expect(result.data).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should apply minPrice and maxPrice filters and verify query builder where conditions', async () => {
      const mockServiceItem = {
        id: 1,
        name: 'Carpet Cleaning',
        description: 'Deep carpet steam cleaning',
        price: '250.00',
        durationMinutes: 90,
        status: 'ACTIVE',
        categoryId: 1,
        providerId: 10,
        category: { id: 1, name: 'Cleaning', isActive: true, parentId: null },
        provider: { id: 10, displayName: 'Pro 10', bio: 'Bio', status: 'ACTIVE', timezone: 'UTC' },
        images: [],
      };

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
        all: jest.fn().mockResolvedValue([mockServiceItem]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ providerId: 10, status: 'APPROVED' }]),
      } as any);

      jest.spyOn(db.orm.public.Category, 'all').mockResolvedValue([
        { id: 1, name: 'Cleaning', isActive: true, parentId: null },
      ] as any);

      jest.spyOn(db.orm.public.Service, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      const result = await service.findAll({
        minPrice: 100,
        maxPrice: 300,
      });

      expect(mockQb.where).toHaveBeenCalled();
      expect(mockQb.aggregate).toHaveBeenCalled();

      // Verify the price filters in where predicates
      const columnSpy = {
        status: { eq: jest.fn() },
        providerId: { in: jest.fn() },
        categoryId: { in: jest.fn() },
        price: { gte: jest.fn(), lte: jest.fn() },
      };

      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });

      expect(columnSpy.price.gte).toHaveBeenCalledWith('100.00');
      expect(columnSpy.price.lte).toHaveBeenCalledWith('300.00');
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should safely escape ILIKE special wildcard characters (%, _, \\) in search query', async () => {
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

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ providerId: 10, status: 'APPROVED' }]),
      } as any);

      jest.spyOn(db.orm.public.Category, 'all').mockResolvedValue([
        { id: 1, name: 'Cleaning', isActive: true, parentId: null },
      ] as any);

      jest.spyOn(db.orm.public.Service, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      await service.findAll({
        search: '100%_clean\\guaranteed',
      });

      const columnSpy = {
        status: { eq: jest.fn() },
        providerId: { in: jest.fn() },
        categoryId: { in: jest.fn() },
        name: { ilike: jest.fn() },
        description: { ilike: jest.fn() },
      };

      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') {
          fn(columnSpy);
        }
      });

      // Assert that %, _, and \ were escaped with backslashes
      expect(columnSpy.name.ilike).toHaveBeenCalledWith('%100\\%\\_clean\\\\guaranteed%');
      expect(columnSpy.description.ilike).toHaveBeenCalledWith('%100\\%\\_clean\\\\guaranteed%');
    });

    it('should apply sorting by price ascending with id tie-breaker', async () => {
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
        all: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ providerId: 10, status: 'APPROVED' }]),
      } as any);
      jest.spyOn(db.orm.public.Category, 'all').mockResolvedValue([
        { id: 1, name: 'Cleaning', isActive: true, parentId: null },
      ] as any);
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue(mockQb);

      await service.findAll({
        sortBy: 'price',
        sortOrder: 'asc',
      });

      expect(mockQb.orderBy).toHaveBeenCalled();
      expect(Array.isArray(capturedOrderBy)).toBe(true);
      const columnSpy = {
        price: { asc: jest.fn() },
        id: { desc: jest.fn() },
      };
      capturedOrderBy[0](columnSpy);
      capturedOrderBy[1](columnSpy);
      expect(columnSpy.price.asc).toHaveBeenCalled();
      expect(columnSpy.id.desc).toHaveBeenCalled();
    });

    it('should apply limit and offset pagination correctly', async () => {
      let capturedLimit = 0;
      let capturedOffset = 0;
      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 45 }),
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
        all: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ providerId: 10, status: 'APPROVED' }]),
      } as any);
      jest.spyOn(db.orm.public.Category, 'all').mockResolvedValue([
        { id: 1, name: 'Cleaning', isActive: true, parentId: null },
      ] as any);
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue(mockQb);

      const result = await service.findAll({
        page: 3,
        limit: 10,
      });

      expect(capturedLimit).toBe(10);
      expect(capturedOffset).toBe(20); // (page 3 - 1) * 10 = 20
      expect(result.meta.totalPages).toBe(5); // Math.ceil(45 / 10) = 5
      expect(result.meta.total).toBe(45);
    });

    it('should return empty results and totalPages 0 when no services match', async () => {
      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 0 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ providerId: 10, status: 'APPROVED' }]),
      } as any);
      jest.spyOn(db.orm.public.Category, 'all').mockResolvedValue([
        { id: 1, name: 'Cleaning', isActive: true, parentId: null },
      ] as any);
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue(mockQb);

      const result = await service.findAll({
        search: 'nonexistent-service-name',
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });
  });

  describe('create', () => {
    it('should throw ForbiddenException if user has no provider profile', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.create(99, {
          name: 'Test',
          description: 'Test description',
          price: 100,
          durationMinutes: 30,
          categoryId: 1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if provider is suspended', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'SUSPENDED' }),
      } as any);

      await expect(
        service.create(10, {
          name: 'Test',
          description: 'Test description',
          price: 100,
          durationMinutes: 30,
          categoryId: 1,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if referenced category is inactive', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, name: 'Inactive Cat', isActive: false }),
      } as any);

      await expect(
        service.create(10, {
          name: 'Test',
          description: 'Test description',
          price: 100,
          durationMinutes: 30,
          categoryId: 1,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if multiple images are marked primary', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, name: 'Home', isActive: true, parentId: null }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.create(10, {
          name: 'Cleaning Pro',
          description: 'Professional cleaning',
          price: 500,
          durationMinutes: 120,
          categoryId: 1,
          images: [
            { storageKey: 'img1.webp', fileName: '1.webp', mimeType: 'image/webp', isPrimary: true },
            { storageKey: 'img2.webp', fileName: '2.webp', mimeType: 'image/webp', isPrimary: true },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duplicate storageKey in image submission', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, name: 'Home', isActive: true, parentId: null }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.create(10, {
          name: 'Cleaning Pro',
          description: 'Professional cleaning',
          price: 500,
          durationMinutes: 120,
          categoryId: 1,
          images: [
            { storageKey: 'same-img.webp', fileName: '1.webp', mimeType: 'image/webp' },
            { storageKey: 'same-img.webp', fileName: '2.webp', mimeType: 'image/webp' },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create service with optional images in an atomic transaction', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, name: 'Home', isActive: true, parentId: null }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      const mockTx = {
        orm: {
          public: {
            Service: {
              create: jest.fn().mockResolvedValue({
                id: 15,
                providerId: 1,
                categoryId: 1,
                name: 'Cleaning Pro',
                description: 'Professional cleaning',
                price: '500.00',
                durationMinutes: 120,
                status: 'ACTIVE',
              }),
            },
            ServiceImage: {
              create: jest.fn().mockResolvedValue({
                id: 101,
                serviceId: 15,
                storageKey: 'img1.webp',
                fileName: '1.webp',
                mimeType: 'image/webp',
                sortOrder: 0,
                isPrimary: true,
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 15,
        name: 'Cleaning Pro',
        images: [{ id: 101, storageKey: 'img1.webp', isPrimary: true }],
      } as any);

      const result = await service.create(10, {
        name: 'Cleaning Pro',
        description: 'Professional cleaning',
        price: 500,
        durationMinutes: 120,
        categoryId: 1,
        images: [
          { storageKey: 'img1.webp', fileName: '1.webp', mimeType: 'image/webp', isPrimary: true },
        ],
      });

      expect(result.id).toBe(15);
      expect(result.images).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if provider is suspended', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 1, providerId: 5 }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'SUSPENDED' }),
      } as any);

      await expect(
        service.update(1, 10, { price: 200 }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if unapproved provider attempts to activate service', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 1, providerId: 5, status: 'INACTIVE', categoryId: 1 }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.update(1, 10, { status: ServiceStatusEnum.ACTIVE }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if activating service under an inactive category', async () => {
      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 1, providerId: 5, status: 'INACTIVE', categoryId: 2 }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, name: 'Inactive Cat', isActive: false }),
      } as any);

      await expect(
        service.update(1, 10, { status: ServiceStatusEnum.ACTIVE }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should deactivate service if historical booking holds exist (avoiding FK constraint violation)', async () => {
      const mockService = {
        id: 1,
        name: 'Service With Historical Holds',
        providerId: 5,
        provider: { userId: 10 },
      };

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
        update: jest.fn().mockResolvedValue({ ...mockService, status: 'INACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      // Even if holds are EXPIRED or RELEASED, FK requires graceful deactivation
      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, serviceId: 1, status: 'EXPIRED' }]),
      } as any);

      const result = await service.delete(1, 10, false);
      expect(result.deactivated).toBe(true);
      expect(result.deleted).toBe(false);
    });

    it('should hard delete service if zero bookings and zero holds exist', async () => {
      const mockService = {
        id: 2,
        name: 'Clean Service',
        providerId: 5,
        provider: { userId: 10 },
      };

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
        delete: jest.fn().mockResolvedValue(true),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Booking, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.BookingHold, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.delete(2, 10, false);
      expect(result.deleted).toBe(true);
      expect(result.deactivated).toBe(false);
    });
  });

  describe('addImage', () => {
    it('should reject image addition with ConflictException if sortOrder already exists', async () => {
      const mockService = {
        id: 1,
        providerId: 5,
        provider: { userId: 10 },
      };

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ServiceImage, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 1, serviceId: 1, sortOrder: 0, isPrimary: true }]),
      } as any);

      await expect(
        service.addImage(1, 10, {
          storageKey: 'services/test.webp',
          fileName: 'test.webp',
          mimeType: 'image/webp',
          sortOrder: 0,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException when maximum limit of 10 images is reached', async () => {
      const mockService = {
        id: 1,
        providerId: 5,
        provider: { userId: 10 },
      };

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(mockService),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, userId: 10, status: 'ACTIVE' }),
      } as any);

      const tenImages = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        serviceId: 1,
        sortOrder: i,
        isPrimary: i === 0,
      }));

      jest.spyOn(db.orm.public.ServiceImage, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue(tenImages),
      } as any);

      await expect(
        service.addImage(1, 10, {
          storageKey: 'services/test.webp',
          fileName: 'test.webp',
          mimeType: 'image/webp',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject path traversal in service image storageKey', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 1, providerId: 1, name: 'Service 1' }),
      } as any);

      await expect(
        service.addImage(1, 10, {
          storageKey: '../secret/img.png',
          fileName: 'img.png',
          mimeType: 'image/png',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent cross-tenant service image storageKey hijacking', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockImplementation((cond: any) => ({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockImplementation(() => {
          if (cond?.id === 1) return Promise.resolve({ id: 1, providerId: 1 });
          if (cond?.id === 99) return Promise.resolve({ id: 99, providerId: 2 });
          return Promise.resolve(null);
        }),
      }) as any);

      jest.spyOn(db.orm.public.ServiceImage, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 10,
          serviceId: 99,
          storageKey: 'services/other_provider.webp',
        }),
        all: jest.fn().mockResolvedValue([]),
      } as any);

      await expect(
        service.addImage(1, 10, {
          storageKey: 'services/other_provider.webp',
          fileName: 'other.webp',
          mimeType: 'image/webp',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should rollback service creation if image creation fails', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 100, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Category, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 5, name: 'Plumbing', isActive: true, parentId: null }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      const mockServiceCreate = jest.fn().mockResolvedValue({ id: 101, name: 'New Service' });
      const mockImageCreate = jest.fn().mockRejectedValue(new Error('Image DB constraint error'));

      jest.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
        const tx = {
          orm: {
            public: {
              Service: { create: mockServiceCreate },
              ServiceImage: {
                where: jest.fn().mockReturnValue({ first: jest.fn().mockResolvedValue(null) }),
                create: mockImageCreate,
              },
            },
          },
        };
        return callback(tx);
      });

      await expect(
        service.create(10, {
          name: 'New Service',
          description: 'Description',
          price: 150,
          durationMinutes: 60,
          categoryId: 5,
          images: [
            { storageKey: 'services/test.webp', fileName: 'test.webp', mimeType: 'image/webp' },
          ],
        }),
      ).rejects.toThrow('Image DB constraint error');

      expect(mockServiceCreate).toHaveBeenCalled();
      expect(mockImageCreate).toHaveBeenCalled();
    });
  });
});
