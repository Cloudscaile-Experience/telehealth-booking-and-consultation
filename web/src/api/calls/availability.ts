import { extensionManager } from '@/utils/extension';

class AvailabilityApi {
  private get axios() {
    return extensionManager.getExtAxios();
  }

  async deleteSlot(slotId: string): Promise<void> {
    await this.axios.delete(`/v1/availability/${slotId}`);
  }
}

export const availabilityApi = new AvailabilityApi();
