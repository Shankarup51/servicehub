import { Test, TestingModule } from '@nestjs/testing';
import { ProvidersService } from './providers.service.js';
import { db } from '../prisma/db.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('ProvidersService', () => {
  let service: ProvidersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProvidersService],
    }).compile();

    service = module.get<ProvidersService>(ProvidersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProfile', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.createProfile(999, {
          displayName: 'Test Pro',
          timezone: 'Asia/Kolkata',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if profile already exists for user (duplicate prevention)', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, email: 'pro@test.com' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10 }),
      } as any);

      await expect(
        service.createProfile(10, {
          displayName: 'Second Profile Attempt',
          timezone: 'Asia/Kolkata',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create profile and draft verification in a transaction', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, email: 'pro@test.com' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderProfile: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                userId: 10,
                displayName: 'Apex Repairs',
                bio: 'Pro repairs',
                timezone: 'Asia/Kolkata',
                status: 'ACTIVE',
                createdAt: new Date(),
                updatedAt: new Date(),
              }),
            },
            ProviderVerification: {
              create: jest.fn().mockResolvedValue({
                id: 100,
                providerId: 1,
                status: 'DRAFT',
                submittedAt: null,
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (callback: any) => {
        return callback(mockTx);
      });

      const result = await service.createProfile(10, {
        displayName: 'Apex Repairs',
        bio: 'Pro repairs',
        timezone: 'Asia/Kolkata',
      });

      expect(result.id).toBe(1);
      expect(result.status).toBe('ACTIVE');
      expect(result.verification.status).toBe('DRAFT');
    });
  });

  describe('getOwnProfile', () => {
    it('should throw NotFoundException if profile does not exist', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getOwnProfile(10)).rejects.toThrow(NotFoundException);
    });

    it('should return own profile with service areas and verification', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          userId: 10,
          displayName: 'Apex Repairs',
          bio: 'Bio',
          timezone: 'Asia/Kolkata',
          status: 'ACTIVE',
          serviceAreas: [{ id: 10, city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([
          {
            id: 200,
            providerId: 1,
            status: 'PENDING',
            submittedAt: new Date(),
            documents: [{ id: 1, documentType: 'ID_PROOF', fileName: 'id.pdf' }],
          },
        ]),
      } as any);

      const result = await service.getOwnProfile(10);
      expect(result.id).toBe(1);
      expect(result.serviceAreas).toHaveLength(1);
      expect(result.verification?.status).toBe('PENDING');
      expect(result.verification?.documents).toHaveLength(1);
    });
  });

  describe('updateOwnProfile', () => {
    it('should throw ForbiddenException if provider is suspended', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'SUSPENDED' }),
      } as any);

      await expect(
        service.updateOwnProfile(10, { displayName: 'Updated Name' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should update editable fields for active provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 1,
          userId: 10,
          displayName: 'Old Name',
          status: 'ACTIVE',
        }),
        update: jest.fn().mockResolvedValue({
          id: 1,
          userId: 10,
          displayName: 'New Name',
          status: 'ACTIVE',
        }),
      } as any);

      const result = await service.updateOwnProfile(10, { displayName: 'New Name' });
      expect(result.displayName).toBe('New Name');
    });
  });

  describe('getPublicProfile', () => {
    it('should throw NotFoundException if provider is not active', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 1, status: 'SUSPENDED' }),
      } as any);

      await expect(service.getPublicProfile(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if provider has no approved verification', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({ id: 1, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(service.getPublicProfile(1)).rejects.toThrow(NotFoundException);
    });

    it('should return public profile with active catalog services and no private docs', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 1,
          displayName: 'Apex Repairs',
          bio: 'Bio',
          timezone: 'Asia/Kolkata',
          status: 'ACTIVE',
          serviceAreas: [{ id: 10, city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 100, providerId: 1, status: 'APPROVED' }),
      } as any);

      jest.spyOn(db.orm.public.Service, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([
          {
            id: 5,
            name: 'AC Cleaning',
            description: 'Cleaning AC',
            price: '500',
            durationMinutes: 60,
            category: { id: 2, name: 'HVAC', isActive: true },
            images: [],
          },
        ]),
      } as any);

      const result = await service.getPublicProfile(1);
      expect(result.id).toBe(1);
      expect(result.displayName).toBe('Apex Repairs');
      expect(result.services).toHaveLength(1);
      expect((result as any).verification).toBeUndefined();
    });
  });

  describe('Service Area Management', () => {
    it('should prevent duplicate service area registration (ConflictException)', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          { id: 1, providerId: 1, city: 'Mumbai', area: 'Bandra', pinCode: '400050' },
        ]),
      } as any);

      await expect(
        service.addServiceArea(10, {
          city: 'Mumbai',
          area: 'Bandra',
          pinCode: '400050',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException when updating service area owned by another provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 99, providerId: 2, city: 'Delhi', area: 'Rohini' }),
      } as any);

      await expect(
        service.updateServiceArea(99, 10, { city: 'New Delhi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when deleting service area owned by another provider', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 99, providerId: 2, city: 'Delhi', area: 'Rohini' }),
      } as any);

      await expect(service.deleteServiceArea(99, 10)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Verification Workflow', () => {
    it('should prevent adding documents while verification application is PENDING review', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([
          { id: 100, providerId: 1, status: 'PENDING', documents: [] },
        ]),
      } as any);

      await expect(
        service.addVerificationDocument(10, {
          documentType: 'ID_PROOF',
          storageKey: 'docs/id.pdf',
          fileName: 'id.pdf',
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent submitting verification when no documents are attached', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([
          { id: 100, providerId: 1, status: 'DRAFT', documents: [] },
        ]),
      } as any);

      await expect(service.submitVerification(10)).rejects.toThrow(BadRequestException);
    });

    it('should submit verification successfully when documents are present', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([
          {
            id: 100,
            providerId: 1,
            status: 'DRAFT',
            documents: [{ id: 1, fileName: 'license.pdf' }],
          },
        ]),
        update: jest.fn().mockResolvedValue({
          id: 100,
          status: 'PENDING',
          submittedAt: new Date(),
        }),
      } as any);

      const result = await service.submitVerification(10);
      expect(result.status).toBe('PENDING');
      expect(result.message).toContain('submitted successfully');
    });

    it('should prevent removing documents when application is APPROVED', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.VerificationDocument, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 5,
          verification: { providerId: 1, status: 'APPROVED' },
        }),
      } as any);

      await expect(service.deleteVerificationDocument(5, 10)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Admin Verification Workflow', () => {
    it('should prevent administrator from approving their own provider profile (separation of duties)', async () => {
      const adminUserId = 50;

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 100,
          status: 'PENDING',
          provider: { id: 1, userId: adminUserId },
        }),
      } as any);

      await expect(
        service.adminApproveVerification(100, adminUserId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should approve application from PENDING to APPROVED and stamp reviewer identity', async () => {
      const reviewerAdminId = 99;

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 100,
          status: 'PENDING',
          provider: { id: 1, userId: 10 },
        }),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderVerification: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({
                  id: 100,
                  providerId: 1,
                  status: 'APPROVED',
                  reviewedAt: new Date(),
                  reviewedBy: reviewerAdminId,
                }),
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      const result = await service.adminApproveVerification(100, reviewerAdminId);
      expect(result.status).toBe('APPROVED');
      expect(result.reviewedBy).toBe(reviewerAdminId);
    });

    it('should reject application from PENDING to REJECTED with rejection reason', async () => {
      const reviewerAdminId = 99;

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        first: jest.fn().mockResolvedValue({
          id: 100,
          status: 'PENDING',
          provider: { id: 1, userId: 10 },
        }),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderVerification: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({
                  id: 100,
                  providerId: 1,
                  status: 'REJECTED',
                  reviewedAt: new Date(),
                  reviewedBy: reviewerAdminId,
                  rejectionReason: 'Invalid business license',
                }),
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      const result = await service.adminRejectVerification(100, reviewerAdminId, {
        rejectionReason: 'Invalid business license',
      });
      expect(result.status).toBe('REJECTED');
      expect(result.rejectionReason).toBe('Invalid business license');
      expect(result.reviewedBy).toBe(reviewerAdminId);
    });
  });

  describe('onboard', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.onboard(999, {
          displayName: 'Test',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'key',
              fileName: 'id.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is suspended', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'SUSPENDED' }),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'key',
              fileName: 'id.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if documents array is empty', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if serviceAreas array is empty', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test',
          serviceAreas: [],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'key',
              fileName: 'id.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if duplicate service area in submission', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test',
          serviceAreas: [
            { city: 'Mumbai', area: 'Bandra', pinCode: '400050' },
            { city: 'Mumbai', area: 'bandra', pinCode: '400050' },
          ],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'key',
              fileName: 'id.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if applicant already has a PENDING application', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'PENDING' }]),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'key',
              fileName: 'id.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if applicant is already APPROVED', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'APPROVED' }]),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'key',
              fileName: 'id.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should successfully onboard customer with PENDING verification in a transaction', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderProfile: {
              create: jest.fn().mockResolvedValue({
                id: 1,
                userId: 10,
                displayName: 'New Pro',
                bio: 'Bio',
                timezone: 'Asia/Kolkata',
                status: 'ACTIVE',
              }),
            },
            ProviderVerification: {
              create: jest.fn().mockResolvedValue({
                id: 100,
                providerId: 1,
                status: 'PENDING',
                submittedAt: new Date(),
              }),
            },
            ProviderServiceArea: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([]),
              }),
              create: jest.fn().mockResolvedValue({
                id: 5,
                providerId: 1,
                city: 'Mumbai',
                area: 'Bandra',
                pinCode: '400050',
              }),
            },
            VerificationDocument: {
              create: jest.fn().mockResolvedValue({
                id: 50,
                verificationId: 100,
                documentType: 'ID_PROOF',
                storageKey: 'key',
                fileName: 'id.pdf',
                mimeType: 'application/pdf',
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      const result = await service.onboard(10, {
        displayName: 'New Pro',
        bio: 'Bio',
        serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
        documents: [
          {
            documentType: 'ID_PROOF',
            storageKey: 'key',
            fileName: 'id.pdf',
            mimeType: 'application/pdf',
          },
        ],
      });

      expect(result.verification.status).toBe('PENDING');
      expect(result.profile.displayName).toBe('New Pro');
      expect(result.serviceAreas).toHaveLength(1);
      expect(result.documents).toHaveLength(1);
    });

    it('should allow rejected applicant to correct and resubmit application', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'REJECTED' }]),
      } as any);

      const mockTx = {
        orm: {
          public: {
            ProviderProfile: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({
                  id: 1,
                  userId: 10,
                  displayName: 'Corrected Pro',
                  bio: 'New Bio',
                  timezone: 'Asia/Kolkata',
                  status: 'ACTIVE',
                }),
              }),
            },
            ProviderVerification: {
              where: jest.fn().mockReturnValue({
                update: jest.fn().mockResolvedValue({
                  id: 100,
                  providerId: 1,
                  status: 'PENDING',
                  submittedAt: new Date(),
                  rejectionReason: null,
                }),
              }),
            },
            ProviderServiceArea: {
              where: jest.fn().mockReturnValue({
                all: jest.fn().mockResolvedValue([
                  { id: 5, city: 'Mumbai', area: 'Bandra', pinCode: '400050' },
                ]),
              }),
              create: jest.fn().mockResolvedValue({}),
            },
            VerificationDocument: {
              create: jest.fn().mockResolvedValue({
                id: 51,
                verificationId: 100,
                documentType: 'BUSINESS_LICENSE',
                storageKey: 'new-key',
                fileName: 'license.pdf',
                mimeType: 'application/pdf',
              }),
            },
          },
        },
      };

      jest.spyOn(db, 'transaction').mockImplementation(async (cb: any) => cb(mockTx));

      const result = await service.onboard(10, {
        displayName: 'Corrected Pro',
        bio: 'New Bio',
        serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
        documents: [
          {
            documentType: 'BUSINESS_LICENSE',
            storageKey: 'new-key',
            fileName: 'license.pdf',
            mimeType: 'application/pdf',
          },
        ],
      });

      expect(result.verification.status).toBe('PENDING');
      expect(result.profile.displayName).toBe('Corrected Pro');
    });
  });

  describe('service areas state rules', () => {
    it('should throw BadRequestException if provider attempts to add service area while application is PENDING review', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'PENDING' }]),
      } as any);

      await expect(
        service.addServiceArea(10, {
          city: 'Pune',
          area: 'Kothrud',
          pinCode: '411038',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow APPROVED provider to add service area without resetting verification status', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'APPROVED' }]),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'create').mockResolvedValue({
        id: 10,
        providerId: 1,
        city: 'Pune',
        area: 'Kothrud',
        pinCode: '411038',
      } as any);

      const result = await service.addServiceArea(10, {
        city: 'Pune',
        area: 'Kothrud',
        pinCode: '411038',
      });

      expect(result.id).toBe(10);
      expect(result.city).toBe('Pune');
    });

    it('should throw ConflictException if duplicate service area is added', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'APPROVED' }]),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          { id: 10, city: 'Pune', area: 'Kothrud', pinCode: '411038' },
        ]),
      } as any);

      await expect(
        service.addServiceArea(10, {
          city: 'pune',
          area: 'kothrud',
          pinCode: '411038',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ForbiddenException if provider attempts to modify another provider service area', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'APPROVED' }]),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 99,
          providerId: 2, // belongs to provider 2, not 1!
          city: 'Delhi',
          area: 'Connaught Place',
          pinCode: '110001',
        }),
      } as any);

      await expect(
        service.updateServiceArea(99, 10, { area: 'New Area' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if customer with no profile attempts to add service area', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      await expect(
        service.addServiceArea(20, {
          city: 'Mumbai',
          area: 'Bandra',
          pinCode: '400050',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow rejected applicant to add service area during correction', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 1, userId: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([{ id: 100, status: 'REJECTED' }]),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.ProviderServiceArea, 'create').mockResolvedValue({
        id: 11,
        providerId: 1,
        city: 'Mumbai',
        area: 'Juhu',
        pinCode: '400049',
      } as any);

      const result = await service.addServiceArea(10, {
        city: 'Mumbai',
        area: 'Juhu',
        pinCode: '400049',
      });

      expect(result.id).toBe(11);
    });

    it('should reject path traversal in document storageKey during onboarding', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      await expect(
        service.onboard(10, {
          displayName: 'Test Pro',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: '../../etc/passwd',
              fileName: 'doc.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should prevent cross-tenant verification document storageKey hijacking', async () => {
      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 2, userId: 20, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue({
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([{ id: 200, status: 'DRAFT', documents: [] }]),
        first: jest.fn().mockResolvedValue({ id: 100, providerId: 1 }), // belongs to provider 1!
      } as any);

      jest.spyOn(db.orm.public.VerificationDocument, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({
          id: 5,
          verificationId: 100,
          storageKey: 'verifications/provider-1/tax.pdf',
        }),
      } as any);

      await expect(
        service.addVerificationDocument(20, {
          documentType: 'ID_PROOF',
          storageKey: 'verifications/provider-1/tax.pdf',
          fileName: 'tax.pdf',
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should map PostgreSQL concurrent unique constraint 23505 race condition to ConflictException in onboard', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue({ id: 10, status: 'ACTIVE' }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        first: jest.fn().mockResolvedValue(null),
      } as any);

      const dbError: any = new Error('duplicate key value violates unique constraint');
      dbError.code = '23505';
      jest.spyOn(db, 'transaction').mockRejectedValue(dbError);

      await expect(
        service.onboard(10, {
          displayName: 'Test Pro',
          serviceAreas: [{ city: 'Mumbai', area: 'Bandra', pinCode: '400050' }],
          documents: [
            {
              documentType: 'ID_PROOF',
              storageKey: 'verifications/safe_key.pdf',
              fileName: 'doc.pdf',
              mimeType: 'application/pdf',
            },
          ],
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('adminListVerifications', () => {
    const mockVerificationItem = {
      id: 1,
      providerId: 10,
      status: 'PENDING',
      submittedAt: new Date('2026-10-01T10:00:00Z'),
      reviewedAt: null,
      rejectionReason: null,
      createdAt: new Date('2026-10-01T09:00:00Z'),
      provider: {
        id: 10,
        userId: 15,
        displayName: 'Apex Cleaners',
        timezone: 'UTC',
        status: 'ACTIVE',
      },
      documents: [],
      reviewer: null,
    };

    it('should return verifications across all statuses when status is omitted', async () => {
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
        all: jest.fn().mockResolvedValue([mockVerificationItem]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([
          { id: 15, email: 'apex@example.com', firstName: 'John', lastName: 'Doe', phone: '123' },
        ]),
      } as any);

      const result = await service.adminListVerifications({});

      expect(mockQb.where).not.toHaveBeenCalled(); // No status filter added to queryBuilder!
      expect(mockQb.aggregate).toHaveBeenCalled();

      const colSpy = {
        id: { gt: jest.fn() },
        status: { eq: jest.fn() },
      };
      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') fn(colSpy);
      });

      expect(colSpy.id.gt).toHaveBeenCalledWith(0);
      expect(colSpy.status.eq).not.toHaveBeenCalled();
      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it.each(['PENDING', 'APPROVED', 'REJECTED', 'DRAFT'] as const)(
      'should filter by explicit status %s',
      async (targetStatus) => {
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
          all: jest.fn().mockResolvedValue([{ ...mockVerificationItem, status: targetStatus }]),
        };

        jest.spyOn(db.orm.public.ProviderVerification, 'where').mockImplementation((pred: any) => {
          whereClauses.push(pred);
          return mockQb;
        });

        jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
          all: jest.fn().mockResolvedValue([]),
        } as any);

        const result = await service.adminListVerifications({ status: targetStatus as any });

        const colSpy = {
          id: { gt: jest.fn() },
          status: { eq: jest.fn() },
        };
        whereClauses.forEach((fn) => {
          if (typeof fn === 'function') fn(colSpy);
        });

        expect(colSpy.status.eq).toHaveBeenCalledWith(targetStatus);
        expect(result.data[0].status).toBe(targetStatus);
      },
    );

    it('should escape ILIKE special wildcard characters (%, _, \\) in verification search', async () => {
      let capturedUserPredicate: any = null;
      jest.spyOn(db.orm.public.User, 'where').mockImplementation((pred: any) => {
        if (!capturedUserPredicate) {
          capturedUserPredicate = pred;
        }
        return {
          select: jest.fn().mockReturnValue({
            all: jest.fn().mockResolvedValue([{ id: 15 }]),
          }),
          all: jest.fn().mockResolvedValue([
            { id: 15, email: 'pro@test.com', firstName: 'Pro', lastName: 'User', phone: '123' },
          ]),
        } as any;
      });

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        select: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue([{ id: 10 }]),
        }),
      } as any);

      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 1 }),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        all: jest.fn().mockResolvedValue([mockVerificationItem]),
      };
      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue(mockQb);

      await service.adminListVerifications({
        search: '100%_verified\\pro',
      });

      const userColSpy = {
        firstName: { ilike: jest.fn() },
        lastName: { ilike: jest.fn() },
        email: { ilike: jest.fn() },
        phone: { ilike: jest.fn() },
      };
      if (typeof capturedUserPredicate === 'function') {
        capturedUserPredicate(userColSpy);
      }

      expect(userColSpy.firstName.ilike).toHaveBeenCalledWith('%100\\%\\_verified\\\\pro%');
    });

    it('should support numeric verification ID in search filter', async () => {
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
        all: jest.fn().mockResolvedValue([mockVerificationItem]),
      };

      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        select: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue([]),
        }),
        all: jest.fn().mockResolvedValue([]),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        select: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockImplementation((pred: any) => {
        whereClauses.push(pred);
        return mockQb;
      });

      await service.adminListVerifications({ search: '42' });

      const colSpy = {
        id: { gt: jest.fn(), eq: jest.fn() },
      };
      whereClauses.forEach((fn) => {
        if (typeof fn === 'function') fn(colSpy);
      });

      expect(colSpy.id.eq).toHaveBeenCalledWith(42);
    });

    it('should return empty results when search does not match any provider or user', async () => {
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        select: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      jest.spyOn(db.orm.public.ProviderProfile, 'where').mockReturnValue({
        select: jest.fn().mockReturnValue({
          all: jest.fn().mockResolvedValue([]),
        }),
      } as any);

      const result = await service.adminListVerifications({
        search: 'nonexistent-pro',
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should apply sorting by createdAt ascending with id tie-breaker', async () => {
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
        all: jest.fn().mockResolvedValue([mockVerificationItem]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue(mockQb);
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      await service.adminListVerifications({
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });

      expect(mockQb.orderBy).toHaveBeenCalled();
      expect(Array.isArray(capturedOrderBy)).toBe(true);
      const colSpy = {
        createdAt: { asc: jest.fn() },
        id: { desc: jest.fn() },
      };
      capturedOrderBy[0](colSpy);
      capturedOrderBy[1](colSpy);
      expect(colSpy.createdAt.asc).toHaveBeenCalled();
      expect(colSpy.id.desc).toHaveBeenCalled();
    });

    it('should apply limit and offset pagination correctly', async () => {
      let capturedLimit = 0;
      let capturedOffset = 0;
      const mockQb: any = {
        where: jest.fn().mockReturnThis(),
        aggregate: jest.fn().mockResolvedValue({ total: 35 }),
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
        all: jest.fn().mockResolvedValue([mockVerificationItem]),
      };

      jest.spyOn(db.orm.public.ProviderVerification, 'where').mockReturnValue(mockQb);
      jest.spyOn(db.orm.public.User, 'where').mockReturnValue({
        all: jest.fn().mockResolvedValue([]),
      } as any);

      const result = await service.adminListVerifications({
        page: 2,
        limit: 10,
      });

      expect(capturedLimit).toBe(10);
      expect(capturedOffset).toBe(10); // (page 2 - 1) * 10 = 10
      expect(result.meta.total).toBe(35);
      expect(result.meta.totalPages).toBe(4); // Math.ceil(35 / 10) = 4
    });
  });
});
