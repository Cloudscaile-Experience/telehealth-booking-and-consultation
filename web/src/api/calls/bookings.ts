import { extensionManager } from '@/utils/extension';

import type {
  Booking,
  BookingDetail,
  CreateBookingPayload,
  ListBookingsParams,
  PaginatedResponse,
  UpdateBookingPayload
} from '@/types/telehealth';

class BookingsApi {
  private get axios() {
    return extensionManager.getExtAxios();
  }

  async list(params: ListBookingsParams = {}): Promise<PaginatedResponse<Booking>> {
    const { data } = await this.axios.get<PaginatedResponse<Booking>>('/v1/bookings', { params });
    return data;
  }

  async getById(id: string): Promise<BookingDetail> {
    const { data } = await this.axios.get<BookingDetail>(`/v1/bookings/${id}`);
    return data;
  }

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const { data } = await this.axios.post<Booking>('/v1/bookings', payload);
    return data;
  }

  async update(id: string, payload: UpdateBookingPayload): Promise<Booking> {
    const { data } = await this.axios.patch<Booking>(`/v1/bookings/${id}`, payload);
    return data;
  }

  async confirm(id: string): Promise<Booking> {
    const { data } = await this.axios.post<Booking>(`/v1/bookings/${id}/confirm`);
    return data;
  }
}

export const bookingsApi = new BookingsApi();
