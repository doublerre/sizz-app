import api from "./api";

export interface Tariff {
  id: string;
  activityId: string;
  activityName: string;
  visitorTypeId: string;
  visitorTypeName: string;
  price: number;
  validFrom: string;
  validUntil?: string;
  active: boolean;
}
export const catalogService = {
  getTarrifs: async (): Promise<Tariff[]> => {
    const { data } = await api.get<Tariff[]>("/catalog/tariffs");
    return data;
  },
};
