export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export interface WeeklyAvailability {
  id: number;
  providerId?: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAvailabilityRequest {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface BlockedSlot {
  id: number;
  providerId?: number;
  startAt: string;
  endAt: string;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBlockedSlotRequest {
  startAt: string;
  endAt: string;
  reason?: string;
}

export interface UpdateBlockedSlotRequest {
  startAt?: string;
  endAt?: string;
  reason?: string;
}

export interface QueryPublicAvailabilityParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  serviceId?: number;
}

export interface TimeSlot {
  startAt: string;
  endAt: string;
}

export interface DateAvailability {
  date: string;
  dayOfWeek: string;
  slots: TimeSlot[];
}

export interface PublicAvailabilityResponse {
  providerId: number;
  displayName: string;
  timezone: string;
  serviceDurationMinutes: number;
  availability: DateAvailability[];
}

export interface AvailabilityActionResponse {
  message: string;
}
