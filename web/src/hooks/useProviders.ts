import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { availabilityApi } from '@/api/calls/availability';
import { providersApi } from '@/api/calls/providers';
import { extensionManager } from '@/utils/extension';

import type {
  CreateProviderPayload,
  ListProvidersParams,
  UpdateProviderPayload
} from '@/types/telehealth';

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
  params: { fromTime?: string; toTime?: string; includeBooked?: boolean } = {}
) =>
  useQuery({
    queryKey: ['providers', providerId, 'slots', params],
    queryFn: () => providersApi.listSlots(providerId, { ...params, pageSize: 50 }),
    enabled: Boolean(providerId)
  });

export const useCreateProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProviderPayload) => providersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      extensionManager.toast('Provider created successfully', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to create provider', 'error');
    }
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateProviderPayload }) =>
      providersApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      queryClient.invalidateQueries({ queryKey: ['providers', id] });
      extensionManager.toast('Provider updated successfully', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to update provider', 'error');
    }
  });
};

export const useDeleteProvider = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => providersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] });
      extensionManager.toast('Provider deleted', 'info');
    },
    onError: () => {
      extensionManager.toast('Failed to delete provider', 'error');
    }
  });
};

export const useCreateSlot = (providerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { startTime: string; endTime: string }) =>
      providersApi.createSlot(providerId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers', providerId, 'slots'] });
      extensionManager.toast('Slot added', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to add slot', 'error');
    }
  });
};

export const useDeleteSlot = (providerId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (slotId: string) => availabilityApi.deleteSlot(slotId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers', providerId, 'slots'] });
      extensionManager.toast('Slot removed', 'info');
    },
    onError: () => {
      extensionManager.toast('Failed to remove slot', 'error');
    }
  });
};
