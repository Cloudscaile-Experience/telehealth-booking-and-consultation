import { extensionManager } from '@/utils/extension';

import type {
  Consultation,
  UpdateNotesPayload,
  UpdateSummaryPayload,
  VideoToken
} from '@/types/telehealth';

class ConsultationsApi {
  private get axios() {
    return extensionManager.getExtAxios();
  }

  async getById(id: string): Promise<Consultation> {
    const { data } = await this.axios.get<Consultation>(`/v1/consultations/${id}`);
    return data;
  }

  async start(id: string): Promise<VideoToken> {
    const { data } = await this.axios.post<VideoToken>(`/v1/consultations/${id}/start`);
    return data;
  }

  async end(id: string): Promise<Consultation> {
    const { data } = await this.axios.post<Consultation>(`/v1/consultations/${id}/end`);
    return data;
  }

  async refreshVideoToken(id: string): Promise<VideoToken> {
    const { data } = await this.axios.get<VideoToken>(`/v1/consultations/${id}/video-token`);
    return data;
  }

  async updateNotes(id: string, payload: UpdateNotesPayload): Promise<Consultation> {
    const { data } = await this.axios.patch<Consultation>(`/v1/consultations/${id}/notes`, payload);
    return data;
  }

  async updateSummary(id: string, payload: UpdateSummaryPayload): Promise<Consultation> {
    const { data } = await this.axios.patch<Consultation>(
      `/v1/consultations/${id}/summary`,
      payload
    );
    return data;
  }
}

export const consultationsApi = new ConsultationsApi();
