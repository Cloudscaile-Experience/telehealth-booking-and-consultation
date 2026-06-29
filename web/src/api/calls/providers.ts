import {
  type RawAvailabilitySlot,
  type RawPage,
  type RawProvider,
  serializeCreateProvider,
  serializeProviderParams,
  serializeSlotParams,
  serializeUpdateProvider,
  transformPage,
  transformProvider,
  transformSlot
} from '@/api/transforms';
import { extensionManager } from '@/utils/extension';

import type {
  AvailabilitySlot,
  CreateProviderPayload,
  ListProvidersParams,
  ListSlotsParams,
  PaginatedResponse,
  Provider,
  UpdateProviderPayload
} from '@/types/telehealth';

class ProvidersApi {
  private get axios() {
    return extensionManager.getExtAxios();
  }

  async list(params: ListProvidersParams = {}): Promise<PaginatedResponse<Provider>> {
    const { data } = await this.axios.get<RawPage<RawProvider>>('/v1/providers', {
      params: serializeProviderParams(params)
    });
    return transformPage(data, transformProvider);
  }

  async getById(id: string): Promise<Provider> {
    const { data } = await this.axios.get<RawProvider>(`/v1/providers/${id}`);
    return transformProvider(data);
  }

  async create(payload: CreateProviderPayload): Promise<Provider> {
    const { data } = await this.axios.post<RawProvider>(
      '/v1/providers',
      serializeCreateProvider(payload)
    );
    return transformProvider(data);
  }

  async update(id: string, payload: UpdateProviderPayload): Promise<Provider> {
    const { data } = await this.axios.patch<RawProvider>(
      `/v1/providers/${id}`,
      serializeUpdateProvider(payload)
    );
    return transformProvider(data);
  }

  async remove(id: string): Promise<void> {
    await this.axios.delete(`/v1/providers/${id}`);
  }

  async listSlots(
    providerId: string,
    params: ListSlotsParams = {}
  ): Promise<PaginatedResponse<AvailabilitySlot>> {
    const { data } = await this.axios.get<RawPage<RawAvailabilitySlot>>(
      `/v1/providers/${providerId}/availability`,
      { params: serializeSlotParams(params) }
    );
    return transformPage(data, transformSlot);
  }

  async createSlot(
    providerId: string,
    payload: { startTime: string; endTime: string }
  ): Promise<AvailabilitySlot> {
    const { data } = await this.axios.post<RawAvailabilitySlot>(
      `/v1/providers/${providerId}/availability`,
      { start_time: payload.startTime, end_time: payload.endTime }
    );
    return transformSlot(data);
  }
}

export const providersApi = new ProvidersApi();
