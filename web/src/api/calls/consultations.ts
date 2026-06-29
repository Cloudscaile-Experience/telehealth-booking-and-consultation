import {
  type RawConsultation,
  type RawVideoToken,
  serializeUpdateNotes,
  transformConsultation,
  transformVideoToken
} from '@/api/transforms';
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
    const { data } = await this.axios.get<RawConsultation>(`/v1/consultations/${id}`);
    return transformConsultation(data);
  }

  async start(id: string): Promise<VideoToken> {
    const { data } = await this.axios.post<RawVideoToken>(`/v1/consultations/${id}/start`);
    return transformVideoToken(data);
  }

  async end(id: string): Promise<Consultation> {
    const { data } = await this.axios.post<RawConsultation>(`/v1/consultations/${id}/end`);
    return transformConsultation(data);
  }

  async refreshVideoToken(id: string): Promise<VideoToken> {
    const { data } = await this.axios.get<RawVideoToken>(`/v1/consultations/${id}/video-token`);
    return transformVideoToken(data);
  }

  async updateNotes(id: string, payload: UpdateNotesPayload): Promise<Consultation> {
    const { data } = await this.axios.patch<RawConsultation>(
      `/v1/consultations/${id}/notes`,
      serializeUpdateNotes(payload)
    );
    return transformConsultation(data);
  }

  async updateSummary(id: string, payload: UpdateSummaryPayload): Promise<Consultation> {
    const { data } = await this.axios.patch<RawConsultation>(
      `/v1/consultations/${id}/summary`,
      payload
    );
    return transformConsultation(data);
  }
}

export const consultationsApi = new ConsultationsApi();
