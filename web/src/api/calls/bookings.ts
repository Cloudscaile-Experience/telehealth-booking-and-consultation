import {
  type RawBooking,
  type RawBookingDetail,
  type RawPage,
  serializeBookingParams,
  serializeCreateBooking,
  serializeUpdateBooking,
  transformBooking,
  transformBookingDetail,
  transformPage
} from '@/api/transforms';
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
    const { data } = await this.axios.get<RawPage<RawBooking>>('/v1/bookings', {
      params: serializeBookingParams(params)
    });
    return transformPage(data, transformBooking);
  }

  async getById(id: string): Promise<BookingDetail> {
    const { data } = await this.axios.get<RawBookingDetail>(`/v1/bookings/${id}`);
    return transformBookingDetail(data);
  }

  async create(payload: CreateBookingPayload): Promise<Booking> {
    const { data } = await this.axios.post<RawBooking>(
      '/v1/bookings',
      serializeCreateBooking(payload)
    );
    return transformBooking(data);
  }

  async update(id: string, payload: UpdateBookingPayload): Promise<Booking> {
    const { data } = await this.axios.patch<RawBooking>(
      `/v1/bookings/${id}`,
      serializeUpdateBooking(payload)
    );
    return transformBooking(data);
  }

  async confirm(id: string): Promise<Booking> {
    const { data } = await this.axios.post<RawBooking>(`/v1/bookings/${id}/confirm`);
    return transformBooking(data);
  }
}

export const bookingsApi = new BookingsApi();
