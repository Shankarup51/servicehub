export type ServiceStatus = "ACTIVE" | "INACTIVE";

export interface ServiceImage {
  id: number;
  serviceId?: number;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt?: string;
}

export interface ServiceListItem {
  id: number;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  status: ServiceStatus | string;
  createdAt: string;
  updatedAt: string;
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
  images: ServiceImage[];
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

export interface ServiceDetail extends ServiceListItem {
  category: {
    id: number;
    name: string;
    description?: string | null;
  };
  provider: {
    id: number;
    displayName: string;
    bio: string | null;
    timezone: string;
    serviceAreas?: Array<{
      id: number;
      city: string;
      area: string;
      pinCode: string;
    }>;
  };
}

export interface QueryServicesParams {
  page?: number;
  limit?: number;
  categoryId?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  providerId?: number;
  sortBy?: "createdAt" | "price" | "name" | "durationMinutes";
  sortOrder?: "asc" | "desc";
}

export interface CreateServiceImageRequest {
  storageKey: string;
  fileName: string;
  mimeType: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateServiceRequest {
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  categoryId: number;
  status?: ServiceStatus;
  images?: CreateServiceImageRequest[];
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  price?: number;
  durationMinutes?: number;
  categoryId?: number;
  status?: ServiceStatus;
}

export interface ServiceActionResponse {
  message: string;
}
