//Clase para gestionar las ventas de boletos (el historial de ventas)
import api from './api';
import type { Refund } from './ticketboot.service';


//Valores de estados de venta
export type SaleStatus = 'Activo' | 'Cancelado';
export type SalePaymentMethod = 'CASH' | 'CARD' | 'MIXED';

export interface SaleHistoryRecord {
  folio: string;
  date: string;
  time: string;
  tickets: number;
  payment: string;
  total: number;
  cashAmount: number;
  cardAmount: number;
  refund: Refund | null;
  status: SaleStatus;
}

export interface SaleItemRequest {
  tariffId: string;
  quantity: number;
}

export interface CreateSaleRequest {
  visitDate: string;
  paymentMethod: SalePaymentMethod;
  cashAmount: number;
  cardAmount: number;
  items: SaleItemRequest[];
}

//Datos para cancelar una venta pendiente
export interface CancelPendingSaleRequest {
  visitDate: string;
  items: SaleItemRequest[];
}

//
export interface SaleResponse {
  folio: string;
  createdAt: string;
  visitDate: string;
  total: number;
  cashAmount: number;
  cardAmount: number;
  ticketCount: number;
  paymentMethod: SalePaymentMethod | 'NONE';
  status: 'COMPLETED' | 'CANCELLED';
  refund: Refund | null;
}

const paymentLabels: Record<SalePaymentMethod | 'NONE', string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  MIXED: 'Pago mixto',
  NONE: 'Sin pago',
};

//Bloque de formato de fecha para la clave de ventas
export const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const mapSale = (sale: SaleResponse): SaleHistoryRecord => {
  const createdAt = new Date(sale.createdAt);
  if (Number.isNaN(createdAt.getTime())) {
    throw new Error(`El servidor devolvió una fecha inválida para la venta ${sale.folio}.`);
  }
  return {
    folio: sale.folio,
    date: getLocalDateKey(createdAt),
    time: createdAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }), //Hora
    tickets: sale.ticketCount,
    payment: paymentLabels[sale.paymentMethod],
    total: sale.total,
    cashAmount: sale.cashAmount,
    cardAmount: sale.cardAmount,
    refund: sale.refund,
    status: sale.status === 'CANCELLED' ? 'Cancelado' : 'Activo', //Status de la venta
  };
};

//Servicio para gestionar las ventas de boletos
export const salesHistoryService = {
  getSales: async (): Promise<SaleHistoryRecord[]> => {
    const { data } = await api.get<SaleResponse[]>('/ticketboot/sales');
    return data.map(mapSale);
  },
  createSale: async (request: CreateSaleRequest): Promise<SaleResponse> => {
    const { data } = await api.post<SaleResponse>('/ticketboot/sales', request);
    return data;
  },
  createCancellation: async (request: CancelPendingSaleRequest): Promise<SaleResponse> => {
    const { data } = await api.post<SaleResponse>('/ticketboot/sales/cancellations', request);
    return data;
  },
  cancelSale: async (folio: string, reason: string): Promise<SaleResponse> => {
    const { data } = await api.patch<SaleResponse>(
      `/ticketboot/sales/${encodeURIComponent(folio)}/cancel`,
      { reason },
    );
    return data;
  },
};
