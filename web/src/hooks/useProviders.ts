import { useQuery } from '@tanstack/react-query';

import { providersApi } from '@/api/calls/providers';

import type { AvailabilitySlot, ListProvidersParams, PaginatedResponse } from '@/types/telehealth';

export const useProviders = (params: ListProvidersParams = {}) =>
  useQuery({
    queryKey: ['providers', params],
    queryFn: () => providersApi.list(params)
  });

export const useProvider = (id: string) =>
  useQuery({
    queryKey: ['providers', id],
    queryFn: () => providersApi.getById(id),
    enabled: Boolean(id)
  });

export const useProviderSlots = (
  providerId: string,
  params: { fromTime?: string; toTime?: string } = {}
) =>
  useQuery({
    queryKey: ['providers', providerId, 'slots', params],
    queryFn: () =>
      providersApi.listSlots(providerId, { ...params, pageSize: 50 }) as Promise<
        PaginatedResponse<AvailabilitySlot>
      >,
    enabled: Boolean(providerId)
  });
