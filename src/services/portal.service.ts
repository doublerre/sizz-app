import api from "./api";

export interface PublicTariff {
  visitorTypeName: string;
  /** Price in integer cents. */
  price: number;
}

export type ActivityTopic =
  | "FISICA"
  | "ASTRONOMIA"
  | "OPTICA"
  | "INFANTIL"
  | "AMBIENTE"
  | "TECNOLOGIA";

export interface PublicActivity {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  minAge: number | null;
  maxAge: number | null;
  topic: ActivityTopic;
  statusLabel: string;
  tariffs: PublicTariff[];
}
export const portalService = {
  getActivities: async (): Promise<PublicActivity[]> => {
    const { data } = await api.get<PublicActivity[]>("/portal/activities");
    return data;
  },
};
