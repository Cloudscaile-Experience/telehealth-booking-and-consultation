import { extensionManager } from '@/utils/extension';

import type {
  CreateProviderPayload,
  ListProvidersParams,
  PaginatedResponse,
  Provider,
  UpdateProviderPayload
} from '@/types/telehealth';

class ProvidersApi {
  private get axios() {
    return extensionManager.getExtAxios();
  }

  async list(params: ListProvidersParams = {}): Promise<PaginatedResponse<Provider>> {
    const { data } = await this.axios.get<PaginatedResponse<Provider>>('/v1/providers', { params });
    return data;
  }

  async getById(id: string): Promise<Provider> {
    const { data } = await this.axios.get<Provider>(`/v1/providers/${id}`);
    return data;
  }

  async create(payload: CreateProviderPayload): Promise<Provider> {
    const { data } = await this.axios.post<Provider>('/v1/providers', payload);
    return data;
  }

  async update(id: string, payload: UpdateProviderPayload): Promise<Provider> {
    const { data } = await this.axios.patch<Provider>(`/v1/providers/${id}`, payload);
    return data;
  }

  async remove(id: string): Promise<void> {
    await this.axios.delete(`/v1/providers/${id}`);
  }

  async listSlots(
    providerId: string,
    params: { page?: number; pageSize?: number; fromTime?: string; toTime?: string } = {}
  ) {
    const { data } = await this.axios.get(`/v1/providers/${providerId}/availability`, { params });
    return data;
  }
}

export const providersApi = new ProvidersApi();
