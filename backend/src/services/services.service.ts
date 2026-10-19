import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { or } from '@prisma/orm-postgres/orm-client';
import { db } from '../prisma/db.js';
import { QueryServicesDto } from './dto/query-services.dto.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { CreateServiceImageDto } from './dto/create-service-image.dto.js';

export interface ServiceListItem {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  status: string;
  createdAt: any;
  updatedAt: any;
  category: {
    id: number;
    name: string;
  };
  provider: {
    id: number;
    displayName: string;
    bio: string | null;
    timezone: string;
  };
  images: Array<{
    id: number;
    storageKey: string;
    fileName: string;
    mimeType: string;
    sortOrder: number;
    isPrimary: boolean;
  }>;
}

export interface PaginatedServicesResponse {
  data: ServiceListItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ServicesService {
  /**
   * Public Catalog: Search, filter, and paginate services.
   * Enforces business visibility rules:
   * 1. service.status === 'ACTIVE'
   * 2. service.category.isActive === true and any parent category is active
   * 3. service.provider.status === 'ACTIVE'
   * 4. service.provider must have at least one APPROVED verification
   */
  async findAll(query: QueryServicesDto): Promise<PaginatedServicesResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));

    // Validate categoryId if provided
    if (query.categoryId !== undefined) {
      const catId = Number(query.categoryId);
      if (isNaN(catId) || catId <= 0) {
        throw new BadRequestException('categoryId must be a positive integer');
      }
      const category = await db.orm.public.Category.where({ id: catId }).first();
      if (!category || !category.isActive) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
      if (category.parentId !== null) {
        const parentCat = await db.orm.public.Category.where({ id: category.parentId }).first();
        if (!parentCat || !parentCat.isActive) {
          return {
            data: [],
            meta: { total: 0, page, limit, totalPages: 0 },
          };
        }
      }
    }

    // 1. Fetch approved verifications to determine eligible provider IDs
    const allVerifications = await db.orm.public.ProviderVerification.where({
      status: 'APPROVED',
    }).all();
    const approvedProviderIds = new Set(allVerifications.map((v) => v.providerId));

    if (approvedProviderIds.size === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    // 2. Fetch categories to verify active hierarchy integrity
    const allCategories = await db.orm.public.Category.all();
    const activeCategoryMap = new Map(allCategories.filter((c) => c.isActive).map((c) => [c.id, c]));
    const eligibleCategoryIds = allCategories
      .filter((c) => c.isActive && (c.parentId === null || activeCategoryMap.has(c.parentId)))
      .map((c) => c.id);

    if (eligibleCategoryIds.length === 0) {
      return {
        data: [],
        meta: { total: 0, page, limit, totalPages: 0 },
      };
    }

    // Filter target provider IDs
    let targetProviderIds = Array.from(approvedProviderIds);
    if (query.providerId !== undefined && Number(query.providerId)) {
      const pId = Number(query.providerId);
      if (!approvedProviderIds.has(pId)) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
      targetProviderIds = [pId];
    }

    // Filter target category IDs
    let targetCategoryIds = eligibleCategoryIds;
    if (query.categoryId !== undefined && Number(query.categoryId)) {
      const cId = Number(query.categoryId);
      if (!eligibleCategoryIds.includes(cId)) {
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
        };
      }
      targetCategoryIds = [cId];
    }

    // 3. Build database query collection with Prisma 8 ORM
    let queryBuilder: any = db.orm.public.Service
      .where((s) => s.status.eq('ACTIVE'));

    if (typeof queryBuilder.where === 'function') {
      queryBuilder = queryBuilder
        .where((s: any) => s.providerId.in(targetProviderIds))
        .where((s: any) => s.categoryId.in(targetCategoryIds));
    }

    // Price range filters applied in PostgreSQL query
    if (query.minPrice !== undefined && query.minPrice !== null && !isNaN(Number(query.minPrice))) {
      if (typeof queryBuilder.where === 'function') {
        queryBuilder = queryBuilder.where((s: any) => s.price.gte(Number(query.minPrice).toFixed(2) as any));
      }
    }
    if (query.maxPrice !== undefined && query.maxPrice !== null && !isNaN(Number(query.maxPrice))) {
      if (typeof queryBuilder.where === 'function') {
        queryBuilder = queryBuilder.where((s: any) => s.price.lte(Number(query.maxPrice).toFixed(2) as any));
      }
    }

    // Search filter (name or description) applied in PostgreSQL with case-insensitive ILIKE
    if (query.search && query.search.trim()) {
      const cleanTerm = query.search.trim().replace(/([\\%_])/g, '\\$1');
      const term = `%${cleanTerm}%`;
      if (typeof queryBuilder.where === 'function') {
        queryBuilder = queryBuilder.where((s: any) =>
          or(s.name.ilike(term), s.description.ilike(term))
        );
      }
    }

    // Accurate total matching records count from database aggregate
    let total = 0;
    if (typeof queryBuilder.aggregate === 'function') {
      try {
        const countResult = await queryBuilder.aggregate((a: any) => ({ total: a.count() }));
        total = countResult?.total ?? 0;
      } catch {
        total = 0;
      }
    }

    // Allowlisted sort fields applied in database ORDER BY
    const sortField = query.sortBy || 'createdAt';
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let orderedQuery: any = queryBuilder;
    if (typeof queryBuilder.orderBy === 'function') {
      if (sortField === 'price') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(s: any) => s.price.asc(), (s: any) => s.id.desc()])
          : queryBuilder.orderBy([(s: any) => s.price.desc(), (s: any) => s.id.desc()]);
      } else if (sortField === 'name') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(s: any) => s.name.asc(), (s: any) => s.id.desc()])
          : queryBuilder.orderBy([(s: any) => s.name.desc(), (s: any) => s.id.desc()]);
      } else if (sortField === 'durationMinutes') {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(s: any) => s.durationMinutes.asc(), (s: any) => s.id.desc()])
          : queryBuilder.orderBy([(s: any) => s.durationMinutes.desc(), (s: any) => s.id.desc()]);
      } else {
        orderedQuery = sortOrder === 'asc'
          ? queryBuilder.orderBy([(s: any) => s.createdAt.asc(), (s: any) => s.id.desc()])
          : queryBuilder.orderBy([(s: any) => s.createdAt.desc(), (s: any) => s.id.desc()]);
      }
    }

    // Database LIMIT and OFFSET pagination
    const offset = (page - 1) * limit;
    if (typeof orderedQuery.limit === 'function') {
      orderedQuery = orderedQuery.limit(limit);
    }
    if (typeof orderedQuery.offset === 'function') {
      orderedQuery = orderedQuery.offset(offset);
    }
    if (typeof orderedQuery.include === 'function') {
      orderedQuery = orderedQuery
        .include('category')
        .include('provider')
        .include('images');
    }

    const fetchedItems: any[] = await orderedQuery.all();

    // Defense-in-depth verification for catalog safety
    const filteredItems = fetchedItems.filter((service: any) => {
      if (service.category && !service.category.isActive) return false;
      if (service.category && service.category.parentId !== null && service.category.parentId !== undefined) {
        const parentCat = activeCategoryMap.get(service.category.parentId);
        if (!parentCat || !parentCat.isActive) return false;
      }
      if (service.provider && service.provider.status !== 'ACTIVE') return false;
      if (service.providerId && !approvedProviderIds.has(service.providerId)) return false;
      return true;
    });

    if (total === 0 && filteredItems.length > 0) {
      total = filteredItems.length;
    }
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    const data: ServiceListItem[] = filteredItems.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      durationMinutes: s.durationMinutes,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      category: {
        id: s.category.id,
        name: s.category.name,
      },
      provider: {
        id: s.provider.id,
        displayName: s.provider.displayName,
        bio: s.provider.bio,
        timezone: s.provider.timezone,
      },
      images: ((s.images || []) as Array<{ id: number; storageKey: string; fileName: string; mimeType: string; sortOrder: number; isPrimary: boolean }>)
        .sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) {
            return a.isPrimary ? -1 : 1;
          }
          return a.sortOrder - b.sortOrder;
        })
        .map((img) => ({
          id: img.id,
          storageKey: img.storageKey,
          fileName: img.fileName,
          mimeType: img.mimeType,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  /**
   * Get single service detail with public data sanitization and visibility checks.
   */
  async findOne(id: number, requestingUserId?: number, isAdmin = false) {
    const service = await db.orm.public.Service.where({ id })
      .include('category')
      .include('provider')
      .include('images')
      .first();

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Check if requester is the service owner
    const isOwner =
      requestingUserId !== undefined &&
      service.provider &&
      service.provider.userId === requestingUserId;

    // If not owner and not admin, enforce public catalog visibility rules
    if (!isOwner && !isAdmin) {
      if (service.status !== 'ACTIVE') {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
      if (!service.category || !service.category.isActive) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }

      // If category has a parent, parent category must also be active
      if (service.category.parentId !== null) {
        const parentCategory = await db.orm.public.Category.where({
          id: service.category.parentId,
        }).first();
        if (!parentCategory || !parentCategory.isActive) {
          throw new NotFoundException(`Service with ID ${id} not found`);
        }
      }

      if (!service.provider || service.provider.status !== 'ACTIVE') {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }

      // Verify provider is approved
      const verification = await db.orm.public.ProviderVerification.where({
        providerId: service.providerId,
        status: 'APPROVED',
      }).first();

      if (!verification) {
        throw new NotFoundException(`Service with ID ${id} not found`);
      }
    }

    return {
      id: service.id,
      name: service.name,
      description: service.description,
      price: Number(service.price),
      durationMinutes: service.durationMinutes,
      status: service.status,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      category: service.category
        ? {
            id: service.category.id,
            name: service.category.name,
            description: service.category.description,
            isActive: service.category.isActive,
          }
        : null,
      provider: service.provider
        ? {
            id: service.provider.id,
            displayName: service.provider.displayName,
            bio: service.provider.bio,
            timezone: service.provider.timezone,
          }
        : null,
      images: (service.images || [])
        .sort((a, b) => {
          if (a.isPrimary !== b.isPrimary) {
            return a.isPrimary ? -1 : 1;
          }
          return a.sortOrder - b.sortOrder;
        })
        .map((img) => ({
          id: img.id,
          storageKey: img.storageKey,
          fileName: img.fileName,
          mimeType: img.mimeType,
          sortOrder: img.sortOrder,
          isPrimary: img.isPrimary,
        })),
    };
  }

  /**
   * Create a new service under the authenticated provider's profile.
   * Client-supplied providerId is NEVER trusted.
   */
  async create(userId: number, dto: CreateServiceDto, isAdmin = false) {
    // 1. Resolve ProviderProfile
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();

    if (!profile) {
      throw new ForbiddenException(
        'You must have an active service provider profile to offer catalog services',
      );
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    // 2. Check approval verification status (unless admin)
    if (!isAdmin) {
      const approvedVerification = await db.orm.public.ProviderVerification.where({
        providerId: profile.id,
        status: 'APPROVED',
      }).first();

      if (!approvedVerification) {
        throw new ForbiddenException(
          'Your provider profile must be verified and approved by an administrator before publishing services',
        );
      }
    }

    // 3. Check category exists and is active, along with any parent category
    const category = await db.orm.public.Category.where({ id: dto.categoryId }).first();
    if (!category) {
      throw new BadRequestException(`Category with ID ${dto.categoryId} does not exist`);
    }
    if (!category.isActive) {
      throw new BadRequestException(`Category "${category.name}" is currently inactive`);
    }
    if (category.parentId !== null) {
      const parentCat = await db.orm.public.Category.where({ id: category.parentId }).first();
      if (!parentCat || !parentCat.isActive) {
        throw new BadRequestException(`Parent category is currently inactive`);
      }
    }

    const cleanName = dto.name.trim();

    // 4. Check uniqueness constraint: @@unique([providerId, name])
    const existing = await db.orm.public.Service.where({
      providerId: profile.id,
      name: cleanName as any,
    }).first();

    if (existing) {
      throw new ConflictException(
        `You already offer a service named "${cleanName}". Please choose a distinct title.`,
      );
    }

    // Validate optional images
    if (dto.images && dto.images.length > 0) {
      if (dto.images.length > 10) {
        throw new BadRequestException('A maximum of 10 gallery images can be attached to a service');
      }

      const primaryCount = dto.images.filter((img) => img.isPrimary).length;
      if (primaryCount > 1) {
        throw new BadRequestException('At most one image can be designated as the primary image');
      }

      const storageKeys = new Set<string>();
      for (const img of dto.images) {
        const key = img.storageKey.trim();
        if (key.includes('..') || key.startsWith('/') || key.startsWith('.')) {
          throw new BadRequestException(
            `Image storageKey contains invalid path traversal characters: "${img.storageKey}"`,
          );
        }
        if (storageKeys.has(key)) {
          throw new BadRequestException(`Duplicate image storageKey: "${img.storageKey}"`);
        }
        storageKeys.add(key);
      }
    }

    // 5. Create service and optional images within an atomic transaction
    const createdId = await db.transaction(async (tx) => {
      // Validate cross-tenant image storage keys
      if (dto.images && dto.images.length > 0 && typeof tx.orm?.public?.ServiceImage?.where === 'function') {
        for (const img of dto.images) {
          const key = img.storageKey.trim();
          const existingImg = await tx.orm.public.ServiceImage.where({ storageKey: key }).first();
          if (existingImg && typeof tx.orm?.public?.Service?.where === 'function') {
            const existingService = await tx.orm.public.Service.where({ id: existingImg.serviceId }).first();
            if (existingService && existingService.providerId !== profile.id) {
              throw new ConflictException(
                `The image storage key "${img.storageKey}" is already registered by another service`,
              );
            }
          }
        }
      }

      const service = await tx.orm.public.Service.create({
        providerId: profile.id,
        categoryId: dto.categoryId,
        name: cleanName as any,
        description: dto.description.trim(),
        price: dto.price.toFixed(2) as any,
        durationMinutes: dto.durationMinutes,
        status: (dto.status || 'ACTIVE') as any,
      });

      if (dto.images && dto.images.length > 0) {
        const primaryCount = dto.images.filter((img) => img.isPrimary).length;
        let nextSort = 0;
        for (let i = 0; i < dto.images.length; i++) {
          const img = dto.images[i];
          const sortOrder = img.sortOrder !== undefined ? img.sortOrder : nextSort;
          nextSort = Math.max(nextSort, sortOrder) + 1;
          const isPrimary = primaryCount === 0 ? i === 0 : Boolean(img.isPrimary);

          await tx.orm.public.ServiceImage.create({
            serviceId: service.id,
            storageKey: img.storageKey.trim(),
            fileName: img.fileName.trim() as any,
            mimeType: img.mimeType.trim() as any,
            sortOrder,
            isPrimary,
          });
        }
      }

      return service.id;
    });

    return this.findOne(createdId, userId, true);
  }

  /**
   * Update an existing service.
   * Must enforce strict provider ownership, active provider status, and verification checks on activation.
   */
  async update(id: number, userId: number, dto: UpdateServiceDto, isAdmin = false) {
    const service = await db.orm.public.Service.where({ id })
      .include('provider')
      .first();

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Verify ownership and provider active status
    if (!isAdmin) {
      const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
      if (!profile || profile.id !== service.providerId) {
        throw new ForbiddenException('You do not have permission to modify this service');
      }
      if (profile.status !== 'ACTIVE') {
        throw new ForbiddenException('Your provider account is currently suspended');
      }
    }

    // Verification check if attempting to activate service
    if (dto.status === 'ACTIVE' && !isAdmin) {
      const approvedVerification = await db.orm.public.ProviderVerification.where({
        providerId: service.providerId,
        status: 'APPROVED',
      }).first();

      if (!approvedVerification) {
        throw new ForbiddenException(
          'Your provider profile must be verified and approved before activating services',
        );
      }
    }

    const updatePayload: Record<string, any> = {};

    // Validate category if updating or if activating
    const effectiveCategoryId = dto.categoryId !== undefined ? dto.categoryId : service.categoryId;

    if (dto.categoryId !== undefined || dto.status === 'ACTIVE') {
      const category = await db.orm.public.Category.where({ id: effectiveCategoryId }).first();
      if (!category) {
        throw new BadRequestException(`Category with ID ${effectiveCategoryId} does not exist`);
      }
      if (!category.isActive) {
        throw new BadRequestException(`Category "${category.name}" is currently inactive`);
      }
      if (category.parentId !== null) {
        const parentCat = await db.orm.public.Category.where({ id: category.parentId }).first();
        if (!parentCat || !parentCat.isActive) {
          throw new BadRequestException('Cannot use category whose parent is inactive');
        }
      }
      if (dto.categoryId !== undefined) {
        updatePayload.categoryId = dto.categoryId;
      }
    }

    // Validate name uniqueness if updating
    if (dto.name !== undefined && dto.name.trim() !== service.name) {
      const cleanName = dto.name.trim();
      const existing = await db.orm.public.Service.where({
        providerId: service.providerId,
        name: cleanName as any,
      }).first();

      if (existing && existing.id !== id) {
        throw new ConflictException(
          `You already offer a service named "${cleanName}". Please choose a distinct title.`,
        );
      }
      updatePayload.name = cleanName;
    }

    if (dto.description !== undefined) {
      updatePayload.description = dto.description.trim();
    }
    if (dto.price !== undefined) {
      updatePayload.price = dto.price.toFixed(2);
    }
    if (dto.durationMinutes !== undefined) {
      updatePayload.durationMinutes = dto.durationMinutes;
    }
    if (dto.status !== undefined) {
      updatePayload.status = dto.status;
    }

    if (Object.keys(updatePayload).length > 0) {
      await db.orm.public.Service.where({ id }).update(updatePayload as any);
    }

    return this.findOne(id, userId, true);
  }

  /**
   * Delete or deactivate a service.
   * Relational check:
   * If any bookings or booking holds (active, expired, released) reference this service,
   * gracefully deactivate to preserve history and avoid Foreign Key constraint violations.
   * If zero bookings and zero holds exist, hard delete.
   */
  async delete(id: number, userId: number, isAdmin = false) {
    const service = await db.orm.public.Service.where({ id })
      .include('provider')
      .first();

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    // Verify ownership and active provider
    if (!isAdmin) {
      const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
      if (!profile || profile.id !== service.providerId) {
        throw new ForbiddenException('You do not have permission to delete this service');
      }
      if (profile.status !== 'ACTIVE') {
        throw new ForbiddenException('Your provider account is currently suspended');
      }
    }

    // Check ALL existing bookings
    const bookings = await db.orm.public.Booking.where({ serviceId: id }).all();

    // Check ALL booking holds (regardless of status: ACTIVE, EXPIRED, or RELEASED)
    // because booking_holds.serviceId foreign key constraint prevents hard deletion
    const holds = await db.orm.public.BookingHold.where({
      serviceId: id,
    }).all();

    if (bookings.length > 0 || holds.length > 0) {
      // Gracefully deactivate
      await db.orm.public.Service.where({ id }).update({
        status: 'INACTIVE' as any,
      });

      return {
        message: `Service "${service.name}" has ${bookings.length} existing booking(s) and ${holds.length} historical hold(s). It has been deactivated to preserve customer history and constraint integrity.`,
        deactivated: true,
        deleted: false,
      };
    }

    // Hard delete service (ServiceImage records cascade deleted via schema onDelete: Cascade)
    await db.orm.public.Service.where({ id }).delete();

    return {
      message: `Service "${service.name}" (ID: ${id}) deleted successfully`,
      deactivated: false,
      deleted: true,
    };
  }

  /**
   * Provider Services: Fetch all services owned by the authenticated provider.
   */
  async findProviderServices(userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('Provider profile not found');
    }

    const services = await db.orm.public.Service.where({ providerId: profile.id })
      .include('category')
      .include('images')
      .all();

    services.sort((a, b) => b.id - a.id);

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: Number(s.price),
      durationMinutes: s.durationMinutes,
      status: s.status,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      category: s.category
        ? {
            id: s.category.id,
            name: s.category.name,
          }
        : null,
      images: (s.images || []).sort((a, b) => {
        if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
        return a.sortOrder - b.sortOrder;
      }),
    }));
  }

  /**
   * Add image metadata to a service.
   * Enforces provider ownership, max 10 images, sequential sortOrder, and atomic primary image switch.
   */
  async addImage(
    serviceId: number,
    userId: number,
    dto: CreateServiceImageDto,
    isAdmin = false,
  ) {
    const service = await db.orm.public.Service.where({ id: serviceId })
      .include('provider')
      .first();

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Verify ownership and active provider status
    if (!isAdmin) {
      const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
      if (!profile || profile.id !== service.providerId) {
        throw new ForbiddenException('You do not have permission to modify this service');
      }
      if (profile.status !== 'ACTIVE') {
        throw new ForbiddenException('Your provider account is currently suspended');
      }
    }

    const key = dto.storageKey.trim();
    if (key.includes('..') || key.startsWith('/') || key.startsWith('.')) {
      throw new BadRequestException('storageKey contains invalid path traversal characters');
    }

    const imgQuery = db.orm.public.ServiceImage.where({ storageKey: key });
    const existingImg = typeof imgQuery?.first === 'function' ? await imgQuery.first() : null;
    if (existingImg && typeof db.orm?.public?.Service?.where === 'function') {
      const existingService = await db.orm.public.Service.where({ id: existingImg.serviceId }).first();
      if (existingService && existingService.providerId !== service.providerId) {
        throw new ConflictException(
          `The image storage key "${dto.storageKey}" is already registered by another service`,
        );
      }
    }

    // Query existing images
    const existingImages = await db.orm.public.ServiceImage.where({ serviceId }).all();

    // Enforce maximum cap of 10 images per service
    if (existingImages.length >= 10) {
      throw new BadRequestException('Maximum limit of 10 images per service reached');
    }

    // Calculate sequential sortOrder if not provided
    const maxSortOrder = existingImages.reduce((max, img) => Math.max(max, img.sortOrder), -1);
    let targetSortOrder = dto.sortOrder;

    if (targetSortOrder === undefined || targetSortOrder === null) {
      targetSortOrder = maxSortOrder + 1;
    } else {
      // Validate collision on sortOrder unique constraint @@unique([serviceId, sortOrder])
      const hasCollision = existingImages.some((img) => img.sortOrder === targetSortOrder);
      if (hasCollision) {
        throw new ConflictException(
          `An image with sortOrder ${targetSortOrder} already exists for this service. Please choose a different sortOrder.`,
        );
      }
    }

    // First image added to a service should automatically be primary if not explicitly specified
    const shouldBePrimary =
      dto.isPrimary !== undefined ? dto.isPrimary : existingImages.length === 0;

    // Use transaction for atomic primary switch and insert
    return db.transaction(async (tx) => {
      if (shouldBePrimary) {
        for (const img of existingImages) {
          if (img.isPrimary) {
            await tx.orm.public.ServiceImage.where({ id: img.id }).update({
              isPrimary: false,
            });
          }
        }
      }

      return tx.orm.public.ServiceImage.create({
        serviceId,
        storageKey: dto.storageKey,
        fileName: dto.fileName as any,
        mimeType: dto.mimeType as any,
        sortOrder: targetSortOrder,
        isPrimary: shouldBePrimary,
      });
    });
  }

  /**
   * Delete an image from a service.
   * Enforces provider ownership and promotes the next available image if primary was deleted.
   */
  async deleteImage(
    serviceId: number,
    imageId: number,
    userId: number,
    isAdmin = false,
  ) {
    const service = await db.orm.public.Service.where({ id: serviceId })
      .include('provider')
      .first();

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    // Verify ownership and active provider status
    if (!isAdmin) {
      const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
      if (!profile || profile.id !== service.providerId) {
        throw new ForbiddenException('You do not have permission to modify this service');
      }
      if (profile.status !== 'ACTIVE') {
        throw new ForbiddenException('Your provider account is currently suspended');
      }
    }

    const image = await db.orm.public.ServiceImage.where({
      id: imageId,
      serviceId,
    }).first();

    if (!image) {
      throw new NotFoundException(`Image with ID ${imageId} not found for this service`);
    }

    // Use transaction to delete and re-elect primary if needed
    return db.transaction(async (tx) => {
      await tx.orm.public.ServiceImage.where({ id: imageId }).delete();

      // If the deleted image was primary, promote the first remaining image (by sortOrder) to primary
      if (image.isPrimary) {
        const remainingImages = await tx.orm.public.ServiceImage.where({ serviceId }).all();
        if (remainingImages.length > 0) {
          remainingImages.sort((a, b) => a.sortOrder - b.sortOrder);
          await tx.orm.public.ServiceImage.where({ id: remainingImages[0].id }).update({
            isPrimary: true,
          });
        }
      }

      return {
        message: `Image ${imageId} removed successfully`,
      };
    });
  }
}
