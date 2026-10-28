import api from "./api";

export interface ActiveShift {
  id: string;
  status: "OPEN" | "CLOSED";
  cashierName: string | null;
  openedAt: string;
  openingAmount: number;
}

export interface TicketbootDashboard {
  activeShift: ActiveShift | null;
  salesTotal: number;
  salesCount: number;
  ticketCount: number;
  cashInDrawer: number;
  cardPayments: number;
  cardPaymentCount: number;
  visitorsToday: number;
}

export interface OpenShiftPayload {
  openingAmount: number;
  notes: string | null;
}

export const ticketbootService = {
  getDashboard: async (): Promise<TicketbootDashboard> => {
    const { data } = await api.get<TicketbootDashboard>("/ticketboot/dashboard");
    return data;
  },
  openShift: async (payload: OpenShiftPayload): Promise<ActiveShift> => {
    const { data } = await api.post<ActiveShift>("/ticketboot/shifts", payload);
    return data;
  },
};
