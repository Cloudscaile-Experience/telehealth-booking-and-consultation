import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bookingsApi } from '@/api/calls/bookings';
import { extensionManager } from '@/utils/extension';

import type { CreateBookingPayload, ListBookingsParams, UpdateBookingPayload } from '@/types/telehealth';

export const useBookings = (params: ListBookingsParams = {}) =>
  useQuery({
    queryKey: ['bookings', params],
    queryFn: () => bookingsApi.list(params)
  });

export const useBooking = (id: string) =>
  useQuery({
    queryKey: ['bookings', id],
    queryFn: () => bookingsApi.getById(id),
    enabled: Boolean(id)
  });

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      extensionManager.toast('Appointment booked successfully', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to book appointment. The slot may no longer be available.', 'error');
    }
  });
};

export const useUpdateBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateBookingPayload }) =>
      bookingsApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings', id] });
    },
    onError: () => {
      extensionManager.toast('Failed to update booking', 'error');
    }
  });
};

export const useCancelBooking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      bookingsApi.update(id, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      extensionManager.toast('Appointment cancelled', 'info');
    },
    onError: () => {
      extensionManager.toast('Failed to cancel appointment', 'error');
    }
  });
};
