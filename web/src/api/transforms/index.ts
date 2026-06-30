import type {
  AvailabilitySlot,
  Booking,
  BookingDetail,
  BookingStatus,
  Consultation,
  ConsultationStatus,
  PaginatedResponse,
  Provider,
  ProviderSpecialty,
  VideoToken
} from '@/types/telehealth';

// ── Raw response shapes (snake_case from API) ─────────────────────────────────

export interface RawProvider {
  id: string;
  name: string;
  email: string;
  specialty: ProviderSpecialty;
  bio: string | null;
  avatar_url: string | null;
  languages: string;
  consultation_fee: number;
  rating: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawAvailabilitySlot {
  id: string;
  provider_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawBooking {
  id: string;
  patient_id: string;
  provider_id: string;
  slot_id: string;
  status: BookingStatus;
  patient_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawBookingDetail extends RawBooking {
  slot: RawAvailabilitySlot;
  consultation_id: string | null;
}

export interface RawConsultation {
  id: string;
  booking_id: string;
  video_session_id: string;
  status: ConsultationStatus;
  started_at: string | null;
  ended_at: string | null;
  provider_notes: string | null;
  patient_notes: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface RawVideoToken {
  token: string;
  session_id: string;
  expires_at: string;
}

export interface RawPage<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// ── Response transforms (snake_case → camelCase) ──────────────────────────────

export const transformProvider = (raw: RawProvider): Provider => ({
  id: raw.id,
  name: raw.name,
  email: raw.email,
  specialty: raw.specialty,
  bio: raw.bio,
  avatarUrl: raw.avatar_url,
  languages: raw.languages,
  consultationFee: raw.consultation_fee,
  rating: raw.rating,
  isActive: raw.is_active,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
});

export const transformSlot = (raw: RawAvailabilitySlot): AvailabilitySlot => ({
  id: raw.id,
  providerId: raw.provider_id,
  startTime: raw.start_time,
  endTime: raw.end_time,
  isBooked: raw.is_booked,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
});

export const transformBooking = (raw: RawBooking): Booking => ({
  id: raw.id,
  patientId: raw.patient_id,
  providerId: raw.provider_id,
  slotId: raw.slot_id,
  status: raw.status,
  patientNotes: raw.patient_notes,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
});

export const transformBookingDetail = (raw: RawBookingDetail): BookingDetail => ({
  ...transformBooking(raw),
  slot: transformSlot(raw.slot),
  consultationId: raw.consultation_id ?? null
});

export const transformConsultation = (raw: RawConsultation): Consultation => ({
  id: raw.id,
  bookingId: raw.booking_id,
  videoSessionId: raw.video_session_id,
  status: raw.status,
  startedAt: raw.started_at,
  endedAt: raw.ended_at,
  providerNotes: raw.provider_notes,
  patientNotes: raw.patient_notes,
  summary: raw.summary,
  createdAt: raw.created_at,
  updatedAt: raw.updated_at
});

export const transformVideoToken = (raw: RawVideoToken): VideoToken => ({
  token: raw.token,
  sessionId: raw.session_id,
  expiresAt: raw.expires_at
});

export const transformPage = <R, T>(
  raw: RawPage<R>,
  transform: (item: R) => T
): PaginatedResponse<T> => ({
  data: raw.data.map(transform),
  total: raw.total,
  page: raw.page,
  pageSize: raw.page_size
});

// ── Request serializers (camelCase → snake_case) ───────────────────────────────

export const serializeProviderParams = (params: {
  page?: number;
  pageSize?: number;
  specialty?: string;
  language?: string;
  search?: string;
  availableFrom?: string;
  availableTo?: string;
}) => ({
  page: params.page,
  page_size: params.pageSize,
  specialty: params.specialty,
  language: params.language,
  search: params.search,
  available_from: params.availableFrom,
  available_to: params.availableTo
});

export const serializeSlotParams = (params: {
  page?: number;
  pageSize?: number;
  fromTime?: string;
  toTime?: string;
  includeBooked?: boolean;
}) => ({
  page: params.page,
  page_size: params.pageSize,
  from_time: params.fromTime,
  to_time: params.toTime,
  include_booked: params.includeBooked
});

export const serializeBookingParams = (params: {
  page?: number;
  pageSize?: number;
  status?: string;
  providerId?: string;
}) => ({
  page: params.page,
  page_size: params.pageSize,
  status: params.status,
  provider_id: params.providerId
});

export const serializeCreateProvider = (p: {
  name: string;
  email: string;
  specialty: string;
  bio?: string;
  avatarUrl?: string;
  languages?: string;
  consultationFee?: number;
}) => ({
  name: p.name,
  email: p.email,
  specialty: p.specialty,
  bio: p.bio,
  avatar_url: p.avatarUrl,
  languages: p.languages,
  consultation_fee: p.consultationFee
});

export const serializeUpdateProvider = (p: {
  name?: string;
  specialty?: string;
  bio?: string;
  avatarUrl?: string;
  languages?: string;
  consultationFee?: number;
  isActive?: boolean;
}) => ({
  name: p.name,
  specialty: p.specialty,
  bio: p.bio,
  avatar_url: p.avatarUrl,
  languages: p.languages,
  consultation_fee: p.consultationFee,
  is_active: p.isActive
});

export const serializeCreateBooking = (p: {
  providerId: string;
  slotId: string;
  patientNotes?: string;
}) => ({
  provider_id: p.providerId,
  slot_id: p.slotId,
  patient_notes: p.patientNotes
});

export const serializeUpdateBooking = (p: {
  status?: string;
  patientNotes?: string;
}) => ({
  status: p.status,
  patient_notes: p.patientNotes
});

export const serializeUpdateNotes = (p: {
  providerNotes?: string;
  patientNotes?: string;
}) => ({
  provider_notes: p.providerNotes,
  patient_notes: p.patientNotes
});
