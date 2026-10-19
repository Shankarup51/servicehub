export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED"
  | "PROVIDER_UNAVAILABLE"
  | "REASSIGNMENT_PENDING"
  | "NEW_PROVIDER_ASSIGNED";

export type AllowedStatusUpdate =
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "REJECTED";

export interface BookingLocation {
  id?: number;
  label?: string | null;
  address: string;
  city: string;
  area: string;
  pinCode: string;
}

export interface CreateBookingLocationRequest {
  label?: string;
  address: string;
  city: string;
  area: string;
  pinCode: string;
}

export interface CreateBookingRequest {
  bookingHoldId: number;
  customerNote?: string;
  location: CreateBookingLocationRequest;
}

export interface BookingStatusHistoryItem {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedBy: number;
  reason?: string | null;
  createdAt: string;
}

export interface BookingCancellation {
  id: number;
  cancelledBy: number;
  reasonCode: string;
  explanation: string | null;
  cancelledAt: string;
}

export interface BookingItem {
  id: number;
  customerId: number;
  providerId: number;
  serviceId: number;
  serviceName: string;
  servicePrice: number;
  serviceDurationMinutes: number;
  discountAmount: number;
  finalAmount: number;
  startAt: string;
  endAt: string;
  status: BookingStatus | string;
  customerNote: string | null;
  providerNote: string | null;
  createdAt: string;
  updatedAt: string;
  location: BookingLocation | null;
  service: {
    id: number;
    name: string;
    durationMinutes: number;
    category?: {
      id: number;
      name: string;
    } | null;
  } | null;
  provider: {
    id: number;
    displayName: string;
    timezone: string;
  } | null;
  customer?: {
    id: number;
    firstName: string;
    lastName: string | null;
    email: string;
    phone: string | null;
  } | null;
  statusHistory?: BookingStatusHistoryItem[];
  cancellation?: BookingCancellation | null;
}

export interface PaginatedBookingsResponse {
  items: BookingItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface QueryBookingsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  timeframe?: "ALL" | "UPCOMING" | "PAST";
  sortBy?: "createdAt" | "startAt" | "finalAmount" | "serviceName";
  sortOrder?: "asc" | "desc";
}

export interface UpdateBookingStatusRequest {
  status: AllowedStatusUpdate;
  reason?: string;
}

export interface CancelBookingRequest {
  reason: string;
  explanation?: string;
}
