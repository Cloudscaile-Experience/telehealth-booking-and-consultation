import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { consultationsApi } from '@/api/calls/consultations';
import { extensionManager } from '@/utils/extension';

import type { UpdateNotesPayload, UpdateSummaryPayload } from '@/types/telehealth';

export const useConsultation = (id: string) =>
  useQuery({
    queryKey: ['consultations', id],
    queryFn: () => consultationsApi.getById(id),
    enabled: Boolean(id)
  });

export const useStartConsultation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consultationsApi.start(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', id] });
    },
    onError: () => {
      extensionManager.toast('Failed to start consultation', 'error');
    }
  });
};

export const useEndConsultation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => consultationsApi.end(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', id] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      extensionManager.toast('Consultation ended', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to end consultation', 'error');
    }
  });
};

export const useUpdateConsultationNotes = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNotesPayload }) =>
      consultationsApi.updateNotes(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', id] });
      extensionManager.toast('Notes saved', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to save notes', 'error');
    }
  });
};

export const useUpdateSummary = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSummaryPayload }) =>
      consultationsApi.updateSummary(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['consultations', id] });
      extensionManager.toast('Summary saved', 'success');
    },
    onError: () => {
      extensionManager.toast('Failed to save summary', 'error');
    }
  });
};
