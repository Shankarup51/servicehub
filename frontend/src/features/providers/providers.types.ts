export type ProviderStatus = "ACTIVE" | "SUSPENDED";
export type VerificationStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
export type VerificationDocumentType =
  | "ID_PROOF"
  | "ADDRESS_PROOF"
  | "BUSINESS_LICENSE"
  | "CERTIFICATION"
  | "INSURANCE"
  | "OTHER";

export interface ProviderServiceArea {
  id: number;
  providerId?: number;
  city: string;
  area: string;
  pinCode: string;
  createdAt?: string;
}

export interface VerificationDocument {
  id: number;
  verificationId?: number;
  documentType: VerificationDocumentType;
  storageKey: string;
  fileName: string;
  mimeType: string;
  createdAt: string;
}

export interface ProviderVerificationDetail {
  id: number;
  providerId: number;
  status: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewerId?: number | null;
  rejectionReason: string | null;
  createdAt?: string;
  updatedAt?: string;
  documents: VerificationDocument[];
}

export interface ProviderOwnProfile {
  id: number;
  userId: number;
  displayName: string;
  bio: string | null;
  timezone: string;
  status: ProviderStatus;
  createdAt: string;
  updatedAt: string;
  serviceAreas: ProviderServiceArea[];
  verification: {
    id: number;
    status: VerificationStatus;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    documents: VerificationDocument[];
  } | null;
}

export interface PublicProviderProfile {
  id: number;
  displayName: string;
  bio: string | null;
  timezone: string;
  serviceAreas: ProviderServiceArea[];
  services: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    durationMinutes: number;
    category: {
      id: number;
      name: string;
    };
    images: Array<{
      id: number;
      storageKey: string;
      fileName: string;
      mimeType: string;
      isPrimary: boolean;
    }>;
  }>;
}

export interface CreateProviderProfileRequest {
  displayName: string;
  bio?: string;
  timezone: string;
}

export interface UpdateProviderProfileRequest {
  displayName?: string;
  bio?: string;
  timezone?: string;
}

export interface CreateServiceAreaRequest {
  city: string;
  area: string;
  pinCode: string;
}

export interface UpdateServiceAreaRequest {
  city?: string;
  area?: string;
  pinCode?: string;
}

export interface CreateVerificationDocumentRequest {
  documentType: VerificationDocumentType;
  storageKey: string;
  fileName: string;
  mimeType: string;
}

export interface ProviderOnboardingRequest {
  displayName: string;
  bio?: string;
  timezone: string;
  serviceAreas: CreateServiceAreaRequest[];
  documents: CreateVerificationDocumentRequest[];
}

export interface ProviderOnboardingResponse {
  profile: {
    id: number;
    displayName: string;
    bio: string | null;
    timezone: string;
    status: ProviderStatus;
  };
  serviceAreas: ProviderServiceArea[];
  verification: {
    id: number;
    status: VerificationStatus;
    submittedAt: string;
    documents: VerificationDocument[];
  };
}

export interface QueryVerificationsParams {
  status?: VerificationStatus | string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "submittedAt" | "createdAt" | "id";
  sortOrder?: "asc" | "desc";
}

export interface AdminVerificationListItem {
  id: number;
  providerId: number;
  status: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  provider: {
    id: number;
    displayName: string;
    user: {
      id: number;
      firstName: string;
      lastName: string | null;
      email: string;
      phone: string | null;
    };
  };
  documentCount: number;
}

export interface PaginatedVerificationsResponse {
  items: AdminVerificationListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminVerificationDetail {
  id: number;
  providerId: number;
  status: VerificationStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  provider: {
    id: number;
    displayName: string;
    bio: string | null;
    timezone: string;
    status: ProviderStatus;
    user: {
      id: number;
      firstName: string;
      lastName: string | null;
      email: string;
      phone: string | null;
    };
    serviceAreas: ProviderServiceArea[];
  };
  documents: VerificationDocument[];
}

export interface AdminRejectVerificationRequest {
  rejectionReason: string;
}

export interface ProviderActionResponse {
  message: string;
}
