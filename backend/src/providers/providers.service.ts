 import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import { or } from '@prisma/orm-postgres/orm-client';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto.js';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto.js';
import { CreateServiceAreaDto } from './dto/create-service-area.dto.js';
import { UpdateServiceAreaDto } from './dto/update-service-area.dto.js';
import { CreateVerificationDocumentDto } from './dto/create-verification-document.dto.js';
import { AdminRejectVerificationDto } from './dto/admin-reject-verification.dto.js';
import { QueryVerificationsDto } from './dto/query-verifications.dto.js';
import { ProviderOnboardingDto } from './dto/provider-onboarding.dto.js';

function nowInstant(): any {
  const temp = (globalThis as any).Temporal;
  return temp && temp.Now ? temp.Now.instant() : new Date();
}

@Injectable()
export class ProvidersService {
  /**
   * Complete provider onboarding application.
   * Atomically coordinates:
   * 1. Profile creation or update (if previously DRAFT or REJECTED)
   * 2. Initial service areas registration (deduplicated)
   * 3. Verification documents registration
   * 4. Transition application to PENDING status for admin review.
   * Executed within a single database transaction.
   */
  async onboard(userId: number, dto: ProviderOnboardingDto) {
    // 1. Verify user exists and is active
    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('Your user account is currently suspended');
    }

    // Validate documents
    if (!dto.documents || dto.documents.length === 0) {
      throw new BadRequestException(
        'At least one verification document (e.g. ID_PROOF, BUSINESS_LICENSE) is required to submit your application',
      );
    }
    if (dto.documents.length > 10) {
      throw new BadRequestException('Maximum limit of 10 verification documents allowed per application');
    }

    const docKeys = new Set<string>();
    for (const doc of dto.documents) {
      const key = doc.storageKey.trim();
      if (key.includes('..') || key.startsWith('/') || key.startsWith('.')) {
        throw new BadRequestException(
          `Document storageKey contains invalid path traversal characters: "${doc.storageKey}"`,
        );
      }
      if (docKeys.has(key)) {
        throw new BadRequestException(`Duplicate document storageKey detected in submission: "${doc.storageKey}"`);
      }
      docKeys.add(key);
    }

    // 3. Validate service areas
    if (!dto.serviceAreas || dto.serviceAreas.length === 0) {
      throw new BadRequestException('At least one operational service area must be registered');
    }
    if (dto.serviceAreas.length > 50) {
      throw new BadRequestException('Maximum limit of 50 service areas allowed');
    }

    // Check for internal duplicates in submitted service areas
    const areaKeys = new Set<string>();
    for (const sa of dto.serviceAreas) {
      const key = `${sa.city.trim().toLowerCase()}|${sa.area.trim().toLowerCase()}|${sa.pinCode.trim().toLowerCase()}`;
      if (areaKeys.has(key)) {
        throw new BadRequestException(
          `Duplicate service area detected in submission: "${sa.area}, ${sa.city} (${sa.pinCode})"`,
        );
      }
      areaKeys.add(key);
    }

    // Check existing profile and verification state
    const existingProfile = await db.orm.public.ProviderProfile.where({ userId }).first();

    let targetProfileId: number | null = null;
    let targetVerificationId: number | null = null;

    if (existingProfile) {
      if (existingProfile.status !== 'ACTIVE') {
        throw new ForbiddenException('Your provider account is currently suspended');
      }

      const verifications = await db.orm.public.ProviderVerification.where({
        providerId: existingProfile.id,
      }).all();
      verifications.sort((a, b) => b.id - a.id);
      const latest = verifications[0];

      if (latest) {
        if (latest.status === 'APPROVED') {
          throw new ConflictException(
            'Your provider profile is already approved and verified. Use profile update endpoints to modify your profile.',
          );
        }
        if (latest.status === 'PENDING') {
          throw new ConflictException(
            'Your provider verification application is already submitted and pending review by administrators.',
          );
        }
        // DRAFT or REJECTED: allowed to correct and resubmit
        targetVerificationId = latest.id;
      }
      targetProfileId = existingProfile.id;
    }

    // 4. Execute atomic transaction
    try {
      return await db.transaction(async (tx) => {
        let profile: any;

        if (!targetProfileId) {
          // Create new provider profile
          profile = await tx.orm.public.ProviderProfile.create({
            userId,
            displayName: dto.displayName.trim() as any,
            bio: dto.bio?.trim() ?? null,
            timezone: (dto.timezone || 'Asia/Kolkata').trim() as any,
            status: 'ACTIVE',
          });
        } else {
          // Update existing profile fields
          profile = await tx.orm.public.ProviderProfile.where({ id: targetProfileId }).update({
            displayName: dto.displayName.trim() as any,
            bio: dto.bio?.trim() ?? null,
            timezone: (dto.timezone || 'Asia/Kolkata').trim() as any,
            updatedAt: nowInstant(),
          });
        }

        // Handle verification record
        let verification: any;
        if (targetVerificationId) {
          // Transition existing DRAFT or REJECTED to PENDING
          verification = await tx.orm.public.ProviderVerification.where({ id: targetVerificationId }).update({
            status: 'PENDING',
            submittedAt: nowInstant(),
            rejectionReason: null,
            updatedAt: nowInstant(),
          });
        } else {
          // Create new PENDING verification
          verification = await tx.orm.public.ProviderVerification.create({
            providerId: profile.id,
            status: 'PENDING',
            submittedAt: nowInstant(),
          });
        }

        // Register initial service areas
        const existingAreas = await tx.orm.public.ProviderServiceArea.where({
          providerId: profile.id,
        }).all();

        const createdAreas: any[] = [];
        for (const sa of dto.serviceAreas) {
          const city = sa.city.trim();
          const area = sa.area.trim();
          const pinCode = sa.pinCode.trim();

          const alreadyExists = existingAreas.some(
            (ea) =>
              ea.city.toLowerCase() === city.toLowerCase() &&
              ea.area.toLowerCase() === area.toLowerCase() &&
              ea.pinCode.toLowerCase() === pinCode.toLowerCase(),
          );

          if (!alreadyExists) {
            const newArea = await tx.orm.public.ProviderServiceArea.create({
              providerId: profile.id,
              city: city as any,
              area: area as any,
              pinCode: pinCode as any,
            });
            createdAreas.push(newArea);
          }
        }

        // Register verification documents with cross-tenant conflict validation
        const createdDocuments: any[] = [];
        for (const doc of dto.documents) {
          const key = doc.storageKey.trim();

          if (typeof tx.orm?.public?.VerificationDocument?.where === 'function') {
            const existingDoc = await tx.orm.public.VerificationDocument.where({
              storageKey: key,
            }).first();

            if (existingDoc && typeof tx.orm?.public?.ProviderVerification?.where === 'function') {
              const verif = await tx.orm.public.ProviderVerification.where({
                id: existingDoc.verificationId,
              }).first();

              if (verif && verif.providerId !== profile.id) {
                throw new ConflictException(
                  `The document storage key "${doc.storageKey}" is already registered by another provider account`,
                );
              }
            }
          }

          const newDoc = await tx.orm.public.VerificationDocument.create({
            verificationId: verification.id,
            documentType: doc.documentType.trim() as any,
            storageKey: key,
            fileName: doc.fileName.trim() as any,
            mimeType: doc.mimeType.trim() as any,
          });
          createdDocuments.push(newDoc);
        }

        return {
          message: 'Provider application submitted successfully and is pending administrator review',
          profile: {
            id: profile.id,
            userId: profile.userId,
            displayName: profile.displayName,
            bio: profile.bio,
            timezone: profile.timezone,
            status: profile.status,
          },
          verification: {
            id: verification.id,
            status: verification.status,
            submittedAt: verification.submittedAt,
          },
          serviceAreas: [...existingAreas, ...createdAreas].map((a) => ({
            id: a.id,
            city: a.city,
            area: a.area,
            pinCode: a.pinCode,
          })),
          documents: createdDocuments.map((d) => ({
            id: d.id,
            documentType: d.documentType,
            storageKey: d.storageKey,
            fileName: d.fileName,
            mimeType: d.mimeType,
          })),
        };
      });
    } catch (err: any) {
      if (
        err?.code === '23505' ||
        err?.message?.includes('unique constraint') ||
        err?.message?.includes('duplicate key')
      ) {
        throw new ConflictException('Provider application already submitted or in progress');
      }
      throw err;
    }
  }

  /**
   * Initialize a new ProviderProfile for the authenticated user.
   * Enforces 1:1 user-provider relationship and creates an initial DRAFT verification.
   */
  async createProfile(userId: number, dto: CreateProviderProfileDto) {
    // 1. Verify user exists
    const user = await db.orm.public.User.where({ id: userId }).first();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 2. Prevent duplicate provider profile
    const existing = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (existing) {
      throw new ConflictException('Provider profile already exists for this user account');
    }

    // 3. Create profile and initial verification inside a transaction
    try {
      return await db.transaction(async (tx) => {
        const profile = await tx.orm.public.ProviderProfile.create({
          userId,
          displayName: dto.displayName.trim() as any,
          bio: dto.bio?.trim() ?? null,
          timezone: dto.timezone.trim() as any,
          status: 'ACTIVE',
        });

        const verification = await tx.orm.public.ProviderVerification.create({
          providerId: profile.id,
          status: 'DRAFT',
        });

        return {
          id: profile.id,
          userId: profile.userId,
          displayName: profile.displayName,
          bio: profile.bio,
          timezone: profile.timezone,
          status: profile.status,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          verification: {
            id: verification.id,
            status: verification.status,
            submittedAt: verification.submittedAt,
          },
        };
      });
    } catch (err: any) {
      if (
        err?.code === '23505' ||
        err?.message?.includes('unique constraint') ||
        err?.message?.includes('duplicate key')
      ) {
        throw new ConflictException('Provider profile already exists for this user account');
      }
      throw err;
    }
  }

  /**
   * Get authenticated provider's own complete profile, including verification status and service areas.
   */
  async getOwnProfile(userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId })
      .include('serviceAreas')
      .first();

    if (!profile) {
      throw new NotFoundException('Provider profile not found for authenticated user');
    }

    // Fetch verifications for this provider
    const verifications = await db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    })
      .include('documents')
      .all();

    // Sort to obtain latest verification
    verifications.sort((a, b) => b.id - a.id);
    const latestVerification = verifications[0] ?? null;

    return {
      id: profile.id,
      userId: profile.userId,
      displayName: profile.displayName,
      bio: profile.bio,
      timezone: profile.timezone,
      status: profile.status,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      serviceAreas: (profile.serviceAreas || []).map((sa) => ({
        id: sa.id,
        city: sa.city,
        area: sa.area,
        pinCode: sa.pinCode,
      })),
      verification: latestVerification
        ? {
            id: latestVerification.id,
            status: latestVerification.status,
            submittedAt: latestVerification.submittedAt,
            reviewedAt: latestVerification.reviewedAt,
            rejectionReason: latestVerification.rejectionReason,
            documents: (latestVerification.documents || []).map((doc) => ({
              id: doc.id,
              documentType: doc.documentType,
              storageKey: doc.storageKey,
              fileName: doc.fileName,
              mimeType: doc.mimeType,
              createdAt: doc.createdAt,
            })),
          }
        : null,
    };
  }

  /**
   * Update current provider's editable profile fields.
   */
  async updateOwnProfile(userId: number, dto: UpdateProviderProfileDto) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new NotFoundException('Provider profile not found for authenticated user');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const payload: Record<string, any> = {};
    if (dto.displayName !== undefined) payload.displayName = dto.displayName.trim();
    if (dto.bio !== undefined) payload.bio = dto.bio?.trim() ?? null;
    if (dto.timezone !== undefined) payload.timezone = dto.timezone.trim();

    if (Object.keys(payload).length === 0) {
      return profile;
    }

    const updated = await db.orm.public.ProviderProfile.where({ id: profile.id }).update(payload as any);
    if (!updated) {
      throw new NotFoundException('Provider profile not found');
    }
    return updated;
  }

  /**
   * Retrieve an eligible public provider profile by ID.
   * Public visibility requires:
   * 1. profile.status === 'ACTIVE'
   * 2. Provider has an APPROVED verification
   * Never leaks private documents, email, or credentials.
   */
  async getPublicProfile(id: number) {
    const profile = await db.orm.public.ProviderProfile.where({ id })
      .include('serviceAreas')
      .first();

    if (!profile) {
      throw new NotFoundException(`Provider with ID ${id} not found`);
    }

    if (profile.status !== 'ACTIVE') {
      throw new NotFoundException(`Provider with ID ${id} is currently unavailable`);
    }

    // Verify provider is approved
    const approvedVerification = await db.orm.public.ProviderVerification.where({
      providerId: id,
      status: 'APPROVED',
    }).first();

    if (!approvedVerification) {
      throw new NotFoundException(`Provider with ID ${id} is not verified or unavailable`);
    }

    // Fetch active catalog services for this provider
    const services = await db.orm.public.Service.where({
      providerId: id,
      status: 'ACTIVE' as any,
    })
      .include('category')
      .include('images')
      .all();

    const activeServices = services
      .filter((s) => s.category && s.category.isActive)
      .map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        price: Number(s.price),
        durationMinutes: s.durationMinutes,
        category: {
          id: s.category.id,
          name: s.category.name,
        },
        images: (s.images || [])
          .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0) || a.sortOrder - b.sortOrder)
          .map((img) => ({
            id: img.id,
            storageKey: img.storageKey,
            fileName: img.fileName,
            mimeType: img.mimeType,
            isPrimary: img.isPrimary,
          })),
      }));

    return {
      id: profile.id,
      displayName: profile.displayName,
      bio: profile.bio,
      timezone: profile.timezone,
      serviceAreas: (profile.serviceAreas || []).map((sa) => ({
        id: sa.id,
        city: sa.city,
        area: sa.area,
        pinCode: sa.pinCode,
      })),
      services: activeServices,
    };
  }

  /**
   * List authenticated provider's service areas.
   */
  async getOwnServiceAreas(userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const areas = await db.orm.public.ProviderServiceArea.where({
      providerId: profile.id,
    }).all();

    return areas.map((a) => ({
      id: a.id,
      city: a.city,
      area: a.area,
      pinCode: a.pinCode,
    }));
  }

  /**
   * Add a new service area for the authenticated provider.
   */
  async addServiceArea(userId: number, dto: CreateServiceAreaDto) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('You must have a provider profile to manage service areas');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const verifQuery = db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    });
    const verifications = typeof verifQuery?.all === 'function' ? await verifQuery.all() : [];
    verifications.sort((a, b) => b.id - a.id);
    const latestVerification = verifications[0];

    if (latestVerification?.status === 'PENDING') {
      throw new BadRequestException(
        'Cannot modify service areas while your application is currently under review by administrators',
      );
    }

    const existingAreas = await db.orm.public.ProviderServiceArea.where({
      providerId: profile.id,
    }).all();

    if (existingAreas.length >= 50) {
      throw new BadRequestException('Maximum limit of 50 service areas reached');
    }

    const city = dto.city.trim();
    const area = dto.area.trim();
    const pinCode = dto.pinCode.trim();

    // Check unique constraint @@unique([providerId, city, area, pinCode])
    const collision = existingAreas.some(
      (a) =>
        a.city.toLowerCase() === city.toLowerCase() &&
        a.area.toLowerCase() === area.toLowerCase() &&
        a.pinCode.toLowerCase() === pinCode.toLowerCase(),
    );

    if (collision) {
      throw new ConflictException(
        `Service area "${area}, ${city} (${pinCode})" is already registered for your profile`,
      );
    }

    return db.orm.public.ProviderServiceArea.create({
      providerId: profile.id,
      city: city as any,
      area: area as any,
      pinCode: pinCode as any,
    });
  }

  /**
   * Update an existing service area. Enforces provider ownership.
   */
  async updateServiceArea(id: number, userId: number, dto: UpdateServiceAreaDto) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('You must have a provider profile to manage service areas');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const verifQuery = db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    });
    const verifications = typeof verifQuery?.all === 'function' ? await verifQuery.all() : [];
    verifications.sort((a, b) => b.id - a.id);
    const latestVerification = verifications[0];

    if (latestVerification?.status === 'PENDING') {
      throw new BadRequestException(
        'Cannot modify service areas while your application is currently under review by administrators',
      );
    }

    const serviceArea = await db.orm.public.ProviderServiceArea.where({ id }).first();
    if (!serviceArea) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    if (serviceArea.providerId !== profile.id) {
      throw new ForbiddenException('You do not have permission to modify this service area');
    }

    const targetCity = dto.city !== undefined ? dto.city.trim() : serviceArea.city;
    const targetArea = dto.area !== undefined ? dto.area.trim() : serviceArea.area;
    const targetPinCode = dto.pinCode !== undefined ? dto.pinCode.trim() : serviceArea.pinCode;

    // Check collision if changed
    const existingAreas = await db.orm.public.ProviderServiceArea.where({
      providerId: profile.id,
    }).all();

    const collision = existingAreas.some(
      (a) =>
        a.id !== id &&
        a.city.toLowerCase() === targetCity.toLowerCase() &&
        a.area.toLowerCase() === targetArea.toLowerCase() &&
        a.pinCode.toLowerCase() === targetPinCode.toLowerCase(),
    );

    if (collision) {
      throw new ConflictException(
        `Service area "${targetArea}, ${targetCity} (${targetPinCode})" is already registered for your profile`,
      );
    }

    return db.orm.public.ProviderServiceArea.where({ id }).update({
      city: targetCity as any,
      area: targetArea as any,
      pinCode: targetPinCode as any,
    });
  }

  /**
   * Remove a service area. Enforces provider ownership.
   */
  async deleteServiceArea(id: number, userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('You must have a provider profile to manage service areas');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const verifQuery = db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    });
    const verifications = typeof verifQuery?.all === 'function' ? await verifQuery.all() : [];
    verifications.sort((a, b) => b.id - a.id);
    const latestVerification = verifications[0];

    if (latestVerification?.status === 'PENDING') {
      throw new BadRequestException(
        'Cannot modify service areas while your application is currently under review by administrators',
      );
    }

    const serviceArea = await db.orm.public.ProviderServiceArea.where({ id }).first();
    if (!serviceArea) {
      throw new NotFoundException(`Service area with ID ${id} not found`);
    }

    if (serviceArea.providerId !== profile.id) {
      throw new ForbiddenException('You do not have permission to delete this service area');
    }

    await db.orm.public.ProviderServiceArea.where({ id }).delete();

    return {
      message: `Service area "${serviceArea.area}, ${serviceArea.city}" deleted successfully`,
    };
  }

  /**
   * Get or initialize current provider's verification status with documents.
   */
  async getOwnVerification(userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    const verifications = await db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    })
      .include('documents')
      .all();

    verifications.sort((a, b) => b.id - a.id);
    let latest: any = verifications[0];

    if (!latest) {
      // Auto-initialize DRAFT verification
      latest = await db.orm.public.ProviderVerification.create({
        providerId: profile.id,
        status: 'DRAFT',
      });
      latest.documents = [];
    }

    return {
      id: latest.id,
      status: latest.status,
      submittedAt: latest.submittedAt,
      reviewedAt: latest.reviewedAt,
      rejectionReason: latest.rejectionReason,
      documents: (latest.documents || []).map((doc: any) => ({
        id: doc.id,
        documentType: doc.documentType,
        storageKey: doc.storageKey,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
      })),
    };
  }

  /**
   * Register verification document metadata.
   * Allowed ONLY when verification status is DRAFT or REJECTED.
   */
  async addVerificationDocument(userId: number, dto: CreateVerificationDocumentDto) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('You must have a provider profile to upload verification documents');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const key = dto.storageKey.trim();
    if (key.includes('..') || key.startsWith('/') || key.startsWith('.')) {
      throw new BadRequestException('storageKey contains invalid path traversal characters');
    }

    const verifications = await db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    })
      .include('documents')
      .all();

    verifications.sort((a, b) => b.id - a.id);
    let current: any = verifications[0];

    if (!current) {
      current = await db.orm.public.ProviderVerification.create({
        providerId: profile.id,
        status: 'DRAFT',
      });
      current.documents = [];
    }

    // Enforce workflow: Documents can only be added to DRAFT or REJECTED applications
    if (current.status === 'PENDING') {
      throw new BadRequestException(
        'Cannot modify documents while your application is currently under review by administrators',
      );
    }
    if (current.status === 'APPROVED') {
      throw new BadRequestException('Your provider profile is already approved and verified');
    }

    // Limit maximum documents
    if ((current.documents || []).length >= 10) {
      throw new BadRequestException('Maximum limit of 10 verification documents reached');
    }

    // Verify storage key is not already registered by another provider account
    const docQuery = db.orm.public.VerificationDocument.where({ storageKey: key });
    const existingDoc = typeof docQuery?.first === 'function' ? await docQuery.first() : null;

    if (existingDoc) {
      const verif = await db.orm.public.ProviderVerification.where({ id: existingDoc.verificationId }).first();
      if (verif && verif.providerId !== profile.id) {
        throw new ConflictException(
          `The document storage key "${dto.storageKey}" is already registered by another provider account`,
        );
      }
    }

    return db.orm.public.VerificationDocument.create({
      verificationId: current.id,
      documentType: dto.documentType.trim() as any,
      storageKey: key,
      fileName: dto.fileName.trim() as any,
      mimeType: dto.mimeType.trim() as any,
    });
  }

  /**
   * Remove a verification document.
   * Allowed ONLY when verification status is DRAFT or REJECTED.
   */
  async deleteVerificationDocument(documentId: number, userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('You must have a provider profile to remove verification documents');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const document = await db.orm.public.VerificationDocument.where({ id: documentId })
      .include('verification')
      .first();

    if (!document) {
      throw new NotFoundException(`Verification document with ID ${documentId} not found`);
    }

    if (document.verification.providerId !== profile.id) {
      throw new ForbiddenException('You do not have permission to remove this document');
    }

    // Enforce workflow: cannot delete documents while under review or approved
    if (document.verification.status === 'PENDING') {
      throw new BadRequestException(
        'Cannot remove documents while your application is currently under review by administrators',
      );
    }
    if (document.verification.status === 'APPROVED') {
      throw new BadRequestException('Cannot remove documents of an approved verification');
    }

    await db.orm.public.VerificationDocument.where({ id: documentId }).delete();

    return {
      message: `Document "${document.fileName}" removed successfully`,
    };
  }

  /**
   * Submit provider verification application for admin review.
   * Enforces valid state transition: DRAFT / REJECTED -> PENDING.
   * Requires at least one document.
   */
  async submitVerification(userId: number) {
    const profile = await db.orm.public.ProviderProfile.where({ userId }).first();
    if (!profile) {
      throw new ForbiddenException('You must have a provider profile to submit verification');
    }

    if (profile.status !== 'ACTIVE') {
      throw new ForbiddenException('Your provider account is currently suspended');
    }

    const verifications = await db.orm.public.ProviderVerification.where({
      providerId: profile.id,
    })
      .include('documents')
      .all();

    verifications.sort((a, b) => b.id - a.id);
    const current = verifications[0];

    if (!current) {
      throw new BadRequestException('No verification application found. Please register document metadata first.');
    }

    if (current.status === 'APPROVED') {
      throw new BadRequestException('Your provider profile is already approved and verified');
    }

    if (current.status === 'PENDING') {
      throw new BadRequestException('Your verification application is already submitted and pending review');
    }

    // Require at least one document
    if (!current.documents || current.documents.length === 0) {
      throw new BadRequestException(
        'You must attach at least one verification document (e.g. ID_PROOF, BUSINESS_LICENSE) before submitting',
      );
    }

    // Update to PENDING
    const updated = await db.orm.public.ProviderVerification.where({ id: current.id }).update({
      status: 'PENDING',
      submittedAt: nowInstant(),
      rejectionReason: null,
    });

    if (!updated) {
      throw new NotFoundException('Verification application not found');
    }

    return {
      message: 'Verification application submitted successfully for administrator review',
      id: updated.id,
      status: updated.status,
      submittedAt: updated.submittedAt,
    };
  }

  /**
   * Admin: List verification applications with server-side status filter, search,
   * allowlisted sorting, and database pagination.
   */
  async adminListVerifications(query: QueryVerificationsDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
    const targetStatus = query.status;

    let queryBuilder = db.orm.public.ProviderVerification.where((v) => v.id.gt(0));

    // Status filter in database query (if specified and not 'ALL')
    if (targetStatus && (targetStatus as any) !== 'ALL') {
      queryBuilder = queryBuilder.where((v) => v.status.eq(targetStatus as any));
    }

    // Search filter across applicant name, email, provider displayName, or numeric verification ID
    if (query.search && query.search.trim()) {
      const rawTerm = query.search.trim();
      const numVal = Number(rawTerm);
      const isNum = !isNaN(numVal) && Number.isInteger(numVal) && numVal > 0;
      const cleanTerm = rawTerm.replace(/([\\%_])/g, '\\$1');
      const termPattern = `%${cleanTerm}%`;

      // 1. Search matching users by email, firstName, lastName, or phone
      const matchingUsers = await db.orm.public.User
        .where((u) =>
          or(
            u.firstName.ilike(termPattern),
            u.lastName.ilike(termPattern),
            u.email.ilike(termPattern),
            u.phone.ilike(termPattern),
          ),
        )
        .select('id')
        .all();
      const userIds = matchingUsers.map((u) => u.id);

      // 2. Search provider profiles by displayName or matching user IDs
      const matchingProviders = userIds.length > 0
        ? await db.orm.public.ProviderProfile
            .where((p) =>
              or(p.displayName.ilike(termPattern), p.userId.in(userIds)),
            )
            .select('id')
            .all()
        : await db.orm.public.ProviderProfile
            .where((p) => p.displayName.ilike(termPattern))
            .select('id')
            .all();
      const providerIds = matchingProviders.map((p) => p.id);

      if (isNum && providerIds.length > 0) {
        queryBuilder = queryBuilder.where((v) =>
          or(v.id.eq(numVal), v.providerId.in(providerIds)),
        );
      } else if (isNum) {
        queryBuilder = queryBuilder.where((v) => v.id.eq(numVal));
      } else if (providerIds.length > 0) {
        queryBuilder = queryBuilder.where((v) => v.providerId.in(providerIds));
      } else {
        // No matches found for search query
        return {
          data: [],
          meta: { total: 0, page, limit, totalPages: 0 },
          items: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }
    }

    // Database aggregate count
    const countResult = await queryBuilder.aggregate((a) => ({ total: a.count() }));
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    // Sorting in database query
    const sortField = query.sortBy || 'submittedAt';
    const sortOrder = (query.sortOrder || 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let orderedQuery = queryBuilder;
    if (sortField === 'createdAt') {
      orderedQuery = sortOrder === 'asc'
        ? queryBuilder.orderBy([(v) => v.createdAt.asc(), (v) => v.id.desc()])
        : queryBuilder.orderBy([(v) => v.createdAt.desc(), (v) => v.id.desc()]);
    } else if (sortField === 'id') {
      orderedQuery = sortOrder === 'asc'
        ? queryBuilder.orderBy((v) => v.id.asc())
        : queryBuilder.orderBy((v) => v.id.desc());
    } else {
      orderedQuery = sortOrder === 'asc'
        ? queryBuilder.orderBy([(v) => v.submittedAt.asc(), (v) => v.id.desc()])
        : queryBuilder.orderBy([(v) => v.submittedAt.desc(), (v) => v.id.desc()]);
    }

    // Database pagination with LIMIT and OFFSET
    const offset = (page - 1) * limit;
    const paginated = await orderedQuery
      .limit(limit)
      .offset(offset)
      .include('provider')
      .include('documents')
      .include('reviewer')
      .all();

    // Fetch user details for each provider in paginated slice
    const userIds = paginated
      .filter((a) => a.provider && a.provider.userId)
      .map((a) => a.provider.userId);

    const users = userIds.length > 0
      ? await db.orm.public.User.where((u) => u.id.in(userIds)).all()
      : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const data = paginated.map((app) => {
      const user = app.provider ? userMap.get(app.provider.userId) : null;
      return {
        id: app.id,
        status: app.status,
        submittedAt: app.submittedAt,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason,
        createdAt: app.createdAt,
        provider: app.provider
          ? {
              id: app.provider.id,
              displayName: app.provider.displayName,
              timezone: app.provider.timezone,
              status: app.provider.status,
              user: user
                ? {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    phone: user.phone,
                  }
                : null,
            }
          : null,
        documents: (app.documents || []).map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          storageKey: doc.storageKey,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
        })),
        reviewer: app.reviewer
          ? {
              id: app.reviewer.id,
              email: app.reviewer.email,
              firstName: app.reviewer.firstName,
              lastName: app.reviewer.lastName,
            }
          : null,
      };
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      items: data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Admin: Get verification application details by ID.
   */
  async adminGetVerification(id: number) {
    const app = await db.orm.public.ProviderVerification.where({ id })
      .include('provider')
      .include('documents')
      .include('reviewer')
      .first();

    if (!app) {
      throw new NotFoundException(`Verification application with ID ${id} not found`);
    }

    let user: any = null;
    if (app.provider && app.provider.userId) {
      user = await db.orm.public.User.where({ id: app.provider.userId }).first();
    }

    return {
      id: app.id,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      rejectionReason: app.rejectionReason,
      provider: app.provider
        ? {
            id: app.provider.id,
            displayName: app.provider.displayName,
            bio: app.provider.bio,
            timezone: app.provider.timezone,
            status: app.provider.status,
            user: user
              ? {
                  id: user.id,
                  email: user.email,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  phone: user.phone,
                }
              : null,
          }
        : null,
      documents: (app.documents || []).map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        storageKey: doc.storageKey,
        fileName: doc.fileName,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
      })),
      reviewer: app.reviewer
        ? {
            id: app.reviewer.id,
            email: app.reviewer.email,
            firstName: app.reviewer.firstName,
            lastName: app.reviewer.lastName,
          }
        : null,
    };
  }

  /**
   * Admin: Approve a verification application.
   * Enforces valid state transition (PENDING -> APPROVED), reviewer stamping, and prevents self-approval.
   */
  async adminApproveVerification(verificationId: number, reviewerUserId: number) {
    const app = await db.orm.public.ProviderVerification.where({ id: verificationId })
      .include('provider')
      .first();

    if (!app) {
      throw new NotFoundException(`Verification application with ID ${verificationId} not found`);
    }

    // State transition guard
    if (app.status === 'APPROVED') {
      throw new BadRequestException('Application is already approved');
    }
    if (app.status === 'DRAFT') {
      throw new BadRequestException('Cannot approve an application that has not yet been submitted by provider');
    }

    // Separation of duties: Administrator cannot approve their own provider profile
    if (app.provider && app.provider.userId === reviewerUserId) {
      throw new ForbiddenException(
        'Conflict of interest: Administrators cannot approve their own provider verification application',
      );
    }

    return db.transaction(async (tx) => {
      const updated = await tx.orm.public.ProviderVerification.where({ id: verificationId }).update({
        status: 'APPROVED',
        reviewedAt: nowInstant(),
        reviewedBy: reviewerUserId,
        rejectionReason: null,
      });

      if (!updated) {
        throw new NotFoundException(`Verification application with ID ${verificationId} not found`);
      }

      // Assign SERVICE_PROVIDER role to the user if not already assigned
      if (app.provider && app.provider.userId && tx.orm?.public?.Role) {
        const providerRole = await tx.orm.public.Role.where({ name: 'SERVICE_PROVIDER' as any }).first();
        if (providerRole && tx.orm?.public?.UserRole) {
          const existingUserRole = await tx.orm.public.UserRole.where({
            userId: app.provider.userId,
            roleId: providerRole.id,
          }).first();
          if (!existingUserRole) {
            await tx.orm.public.UserRole.create({
              userId: app.provider.userId,
              roleId: providerRole.id,
            });
          }
        }
      }

      return {
        message: `Provider application approved successfully`,
        id: updated.id,
        providerId: updated.providerId,
        status: updated.status,
        reviewedAt: updated.reviewedAt,
        reviewedBy: updated.reviewedBy,
      };
    });
  }

  /**
   * Admin: Reject a verification application with a reason.
   * Enforces valid state transition (PENDING -> REJECTED), reviewer stamping, and prevents self-rejection.
   */
  async adminRejectVerification(
    verificationId: number,
    reviewerUserId: number,
    dto: AdminRejectVerificationDto,
  ) {
    const app = await db.orm.public.ProviderVerification.where({ id: verificationId })
      .include('provider')
      .first();

    if (!app) {
      throw new NotFoundException(`Verification application with ID ${verificationId} not found`);
    }

    // State transition guard
    if (app.status === 'APPROVED') {
      throw new BadRequestException('Cannot reject an already approved application');
    }
    if (app.status === 'DRAFT') {
      throw new BadRequestException('Cannot reject an application that has not yet been submitted by provider');
    }

    // Separation of duties
    if (app.provider && app.provider.userId === reviewerUserId) {
      throw new ForbiddenException(
        'Conflict of interest: Administrators cannot review their own provider verification application',
      );
    }

    return db.transaction(async (tx) => {
      const updated = await tx.orm.public.ProviderVerification.where({ id: verificationId }).update({
        status: 'REJECTED',
        reviewedAt: nowInstant(),
        reviewedBy: reviewerUserId,
        rejectionReason: dto.rejectionReason.trim(),
      });

      if (!updated) {
        throw new NotFoundException(`Verification application with ID ${verificationId} not found`);
      }

      return {
        message: `Provider application rejected`,
        id: updated.id,
        providerId: updated.providerId,
        status: updated.status,
        reviewedAt: updated.reviewedAt,
        reviewedBy: updated.reviewedBy,
        rejectionReason: updated.rejectionReason,
      };
    });
  }
}
