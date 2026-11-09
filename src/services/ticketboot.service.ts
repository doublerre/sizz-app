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

export interface ShiftSale {
  folio: string;
  createdAt: string;
  total: number;
  cashAmount: number;
  cardAmount: number;
  ticketCount: number;
  paymentMethod: "CASH" | "CARD" | "MIXED";
  status: "COMPLETED" | "CANCELLED";
  refund: Refund | null;
}

export interface Refund {
  id: string;
  amount: number;
  cashAmount: number;
  cardAmount: number;
  paymentMethod: "CASH" | "CARD" | "MIXED";
  createdAt: string;
  refundedBy: string | null;
  reason: string;
  status: "COMPLETED" | "PENDING_CARD";
}

export interface ShiftTicketCategory {
  name: string;
  ticketCount: number;
}

export interface ShiftSummary {
  id: string;
  cashierName: string | null;
  openedAt: string;
  closedAt: string | null;
  openingAmount: number;
  expectedCash: number;
  countedCash: number | null;
  cashDifference: number | null;
  grossSales: number;
  cancellationTotal: number;
  refundTotal: number;
  cashRefunds: number;
  cardRefunds: number;
  refundCount: number;
  netSales: number;
  cashSales: number;
  cardSales: number;
  salesCount: number;
  cancellationCount: number;
  ticketCount: number;
  openingNotes: string | null;
  closingNotes: string | null;
  sales: ShiftSale[];
  ticketCategories: ShiftTicketCategory[];
}

export interface SaleResponse {
  folio: string;
  createdAt: string;
  visitDate: string;
  total: number;
  cashAmount: number;
  cardAmount: number;
  ticketCount: number;
  paymentMethod: "CASH" | "CARD" | "MIXED" | "NONE";
  status: "COMPLETED" | "CANCELLED";
  refund: Refund | null;
}

export interface CloseShiftPayload {
  countedAmount: number;
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
  getShiftSummary: async (shiftId: string): Promise<ShiftSummary> => {
    const { data } = await api.get<ShiftSummary>(`/ticketboot/shifts/${encodeURIComponent(shiftId)}/summary`);
    return data;
  },
  closeShift: async (shiftId: string, payload: CloseShiftPayload): Promise<ShiftSummary> => {
    const { data } = await api.patch<ShiftSummary>(
      `/ticketboot/shifts/${encodeURIComponent(shiftId)}/close`,
      payload,
    );
    return data;
  },
};
