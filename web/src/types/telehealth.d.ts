// ── Enums ──────────────────────────────────────────────────────────────────────

export type ProviderSpecialty =
  | 'general_practitioner'
  | 'cardiologist'
  | 'dermatologist'
  | 'endocrinologist'
  | 'neurologist'
  | 'oncologist'
  | 'orthopedist'
  | 'pediatrician'
  | 'psychiatrist'
  | 'psychologist'
  | 'radiologist'
  | 'therapist';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';

export type ConsultationStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

// ── Shared ─────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export interface Provider {
  id: string;
  name: string;
  email: string;
  specialty: ProviderSpecialty;
  bio: string | null;
  avatarUrl: string | null;
  /** Comma-separated list, e.g. "English, Spanish" */
  languages: string;
  rating: number;
  consultationFee: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProviderPayload {
  name: string;
  email: string;
  specialty: ProviderSpecialty;
  bio?: string;
  avatarUrl?: string;
  languages?: string;
  consultationFee?: number;
}

export interface UpdateProviderPayload {
  name?: string;
  specialty?: ProviderSpecialty;
  bio?: string;
  avatarUrl?: string;
  languages?: string;
  consultationFee?: number;
  isActive?: boolean;
}

export interface ListProvidersParams {
  page?: number;
  pageSize?: number;
  specialty?: ProviderSpecialty;
  language?: string;
  search?: string;
  availableFrom?: string;
  availableTo?: string;
}

// ── Availability ───────────────────────────────────────────────────────────────

export interface AvailabilitySlot {
  id: string;
  providerId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSlotPayload {
  startTime: string;
  endTime: string;
}

export interface ListSlotsParams {
  page?: number;
  pageSize?: number;
  fromTime?: string;
  toTime?: string;
  includeBooked?: boolean;
}

// ── Booking ────────────────────────────────────────────────────────────────────

export interface Booking {
  id: string;
  patientId: string;
  providerId: string;
  slotId: string;
  status: BookingStatus;
  patientNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingDetail extends Booking {
  slot: AvailabilitySlot;
  consultationId: string | null;
}

export interface CreateBookingPayload {
  providerId: string;
  slotId: string;
  patientNotes?: string;
}

export interface UpdateBookingPayload {
  status?: BookingStatus;
  patientNotes?: string;
}

export interface ListBookingsParams {
  page?: number;
  pageSize?: number;
  status?: BookingStatus;
  providerId?: string;
}

// ── Consultation ───────────────────────────────────────────────────────────────

export interface Consultation {
  id: string;
  bookingId: string;
  videoSessionId: string;
  status: ConsultationStatus;
  startedAt: string | null;
  endedAt: string | null;
  providerNotes: string | null;
  patientNotes: string | null;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VideoToken {
  token: string;
  sessionId: string;
  expiresAt: string;
}

export interface UpdateNotesPayload {
  providerNotes?: string;
  patientNotes?: string;
}

export interface UpdateSummaryPayload {
  summary: string;
}
