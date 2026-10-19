export type BookingHoldStatus = "ACTIVE" | "EXPIRED" | "CONSUMED" | "CANCELLED";

export interface CreateBookingHoldRequest {
  serviceId: number;
  startAt: string;
}

export interface BookingHoldResponse {
  id: number;
  serviceId: number;
  serviceName: string;
  providerId: number;
  providerDisplayName: string;
  startAt: string;
  endAt: string;
  expiresAt: string;
  holdTimeoutMinutes: number;
  status: BookingHoldStatus;
  createdAt: string;
}

export interface ActiveBookingHold {
  id: number;
  serviceId: number;
  serviceName: string | null;
  price: number | null;
  durationMinutes: number | null;
  providerId: number;
  providerDisplayName: string | null;
  startAt: string;
  endAt: string;
  expiresAt: string;
  status: BookingHoldStatus;
  createdAt: string;
}

export interface BookingHoldReleaseResponse {
  message?: string;
  id?: number;
  status?: string;
}
