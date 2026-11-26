import api from "./api.ts";

export type RequesterType = "INDIVIDUAL" | "SCHOOL" | "GROUP";
export type ReservationStatus =
  | "PENDING"
  | "PENDING_VALIDATION"
  | "CONFIRMED"
  | "ATTENDED"
  | "CANCELLED"
  | "NO_SHOW";
export type TimeSlotStatus = "AVAILABLE" | "CLOSED" | "FULL";

export interface ActivityOption {
  id: string;
  name: string;
  active: boolean;
  isReservable: boolean;
}

export interface VisitorType {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface ReservationDetail {
  id: string;
  visitorTypeId: string | null;
  visitorTypeName: string | null;
  quantity: number;
}

export interface ReservationResponse {
  id: string;
  folio: string;
  timeSlotId: string | null;
  slotDate: string | null;
  startTime: string | null;
  endTime: string | null;
  activityName: string | null;
  requesterType: RequesterType;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  institution: string | null;
  visitorCount: number;
  status: ReservationStatus;
  cancelReason: string | null;
  notes: string | null;
  privacyAccepted: boolean | null;
  formVersionId: string | null;
  privacyNoticeVersion: string | null;
  privacyAcceptedAt: string | null;
  answers?: ReservationAnswers | null;
  details: ReservationDetail[];
  createdAt: string;
  updatedAt: string;
}

export interface ReservationRequest {
  timeSlotId: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  institution?: string | null;
  requesterType: RequesterType;
  visitorCount: number;
  notes?: string | null;
  privacyAccepted: true;
  details?: { visitorTypeId: string; quantity: number }[] | null;
  formVersionId?: string | null;
  answers?: ReservationAnswers | null;
}

export type ReservationAnswer = string | number | boolean | string[];
export type ReservationAnswers = Record<string, ReservationAnswer>;

export interface ReservationUpdateRequest {
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  institution?: string | null;
  visitorCount?: number | null;
  notes?: string | null;
  details?: { visitorTypeId: string; quantity: number }[] | null;
  reason: string;
}

export interface ReservationAnswersResponse {
  reservationId: string;
  formVersionId: string | null;
  privacyNoticeVersion: string | null;
  privacyAcceptedAt: string | null;
  answers: ReservationAnswers;
}

export interface ReservationNotification {
  id: string;
  reservationId: string;
  type: "SOLICITUD_RECIBIDA" | "CONFIRMACION" | "CANCELACION";
  sendStatus: "PENDING" | "SENT" | "FAILED";
  attempts: number;
  createdAt: string;
  sentAt: string | null;
}

export interface ReservationAdminNotification extends ReservationNotification {
  recipient: string | null;
  lastError: string | null;
  lastAttemptAt: string | null;
  availableAt: string;
}

export interface AvailabilityResponse {
  slotId: string;
  activityId: string | null;
  activityName: string | null;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  reservedCount: number;
  slotsLeft: number;
  status: TimeSlotStatus;
}

export interface ReservationHistoryResponse {
  historyId: string;
  reservationId: string;
  previousStatus: string | null;
  newStatus: string;
  reason: string | null;
  userId: string | null;
  action: string;
  changesJson: string | null;
  createdAt: string;
}

export interface ReservationPage<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
}

export interface ScheduleTemplate {
  id: string;
  activityId: string | null;
  activityName: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  active: boolean;
}

export interface ScheduleTemplateRequest {
  activityId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  active?: boolean | null;
}

export interface GenerateSlotsRequest {
  fromDate: string;
  toDate: string;
}

export interface TimeSlotExceptionRequest {
  activityId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
}

export interface TimeSlotUpdateRequest {
  startTime?: string;
  endTime?: string;
  maxCapacity?: number;
  reason?: string;
}

export interface TimeSlotClosureRequest {
  activityId: string;
  fromDate: string;
  toDate: string;
  reason: string;
}

export interface TimeSlotHistoryResponse {
  id: string;
  timeSlotId: string;
  action: string;
  changesJson: string;
  userId: string | null;
  reason: string | null;
  createdAt: string;
}

export interface ReservationFilters {
  status?: ReservationStatus;
  fromDate?: string;
  toDate?: string;
  activityId?: string;
  requesterType?: RequesterType;
  search?: string;
}

export const reservationsService = {
  async getActivities(): Promise<ActivityOption[]> {
    const { data } = await api.get<ActivityOption[]>("/catalog/activities");
    return data.filter((activity) => activity.active && activity.isReservable);
  },

  async getVisitorTypes(): Promise<VisitorType[]> {
    const { data } = await api.get<VisitorType[]>("/catalog/visitor-types");
    return data.filter((visitorType) => visitorType.active);
  },

  async getAvailability(activityId: string, date: string): Promise<AvailabilityResponse[]> {
    const { data } = await api.get<AvailabilityResponse[]>("/time-slots/availability", {
      params: { activityId, date },
    });
    return data.filter((slot) => slot.status === "AVAILABLE" && slot.slotsLeft > 0);
  },

  async getTimeSlots(fromDate: string, toDate: string, activityId?: string): Promise<AvailabilityResponse[]> {
    const { data } = await api.get<AvailabilityResponse[]>("/time-slots", {
      params: { fromDate, toDate, ...(activityId ? { activityId } : {}) },
    });
    return data;
  },

  async createReservation(request: ReservationRequest): Promise<ReservationResponse> {
    const { data } = await api.post<ReservationResponse>("/reservations", request);
    return data;
  },

  async getMyReservations(page = 0, size = 20): Promise<ReservationPage<ReservationResponse>> {
    const { data } = await api.get<ReservationPage<ReservationResponse>>("/reservations/my-reservations", {
      params: { page, size },
    });
    return data;
  },

  async listAllMyReservations(): Promise<ReservationResponse[]> {
    const firstPage = await reservationsService.getMyReservations(0, 100);
    const reservations = [...firstPage.content];
    for (let page = 1; page < firstPage.totalPages; page++) {
      const nextPage = await reservationsService.getMyReservations(page, firstPage.size || 100);
      reservations.push(...nextPage.content);
    }
    return reservations;
  },

  async getReservation(id: string): Promise<ReservationResponse> {
    const { data } = await api.get<ReservationResponse>(`/reservations/${encodeURIComponent(id)}`);
    return data;
  },

  async getReservationByFolio(folio: string): Promise<ReservationResponse> {
    const { data } = await api.get<ReservationResponse>(`/reservations/folio/${encodeURIComponent(folio)}`);
    return data;
  },

  async getReservationHistory(id: string): Promise<ReservationHistoryResponse[]> {
    const { data } = await api.get<ReservationHistoryResponse[]>(`/reservations/${encodeURIComponent(id)}/history`);
    return data;
  },

  async listReservations(page = 0, size = 20, filters: ReservationFilters = {}): Promise<ReservationPage<ReservationResponse>> {
    const { data } = await api.get<ReservationPage<ReservationResponse>>("/reservations", {
      params: {
        page,
        size,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.fromDate ? { fromDate: filters.fromDate } : {}),
        ...(filters.toDate ? { toDate: filters.toDate } : {}),
        ...(filters.activityId ? { activityId: filters.activityId } : {}),
        ...(filters.requesterType ? { requesterType: filters.requesterType } : {}),
        ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
      },
    });
    return data;
  },

  async listAllReservations(filters: ReservationFilters = {}): Promise<ReservationResponse[]> {
    const firstPage = await reservationsService.listReservations(0, 100, filters);
    const reservations = [...firstPage.content];
    for (let page = 1; page < firstPage.totalPages; page++) {
      const nextPage = await reservationsService.listReservations(page, firstPage.size || 100, filters);
      reservations.push(...nextPage.content);
    }
    return reservations;
  },

  async updateReservationStatus(id: string, newStatus: ReservationStatus, reason?: string): Promise<ReservationResponse> {
    const { data } = await api.patch<ReservationResponse>(
      `/reservations/${encodeURIComponent(id)}/status`,
      { newStatus, ...(reason?.trim() ? { reason: reason.trim() } : {}) },
    );
    return data;
  },

  async updateReservation(id: string, request: ReservationUpdateRequest): Promise<ReservationResponse> {
    const { data } = await api.patch<ReservationResponse>(`/reservations/${encodeURIComponent(id)}`, request);
    return data;
  },

  async cancelReservation(id: string, reason: string): Promise<ReservationResponse> {
    const { data } = await api.post<ReservationResponse>(`/reservations/${encodeURIComponent(id)}/cancel`, { reason });
    return data;
  },

  async rescheduleReservation(id: string, timeSlotId: string, reason: string): Promise<ReservationResponse> {
    const { data } = await api.post<ReservationResponse>(`/reservations/${encodeURIComponent(id)}/reschedule`, { timeSlotId, reason });
    return data;
  },

  async getReservationAnswers(id: string): Promise<ReservationAnswersResponse> {
    const { data } = await api.get<ReservationAnswersResponse>(`/reservations/${encodeURIComponent(id)}/answers`);
    return data;
  },

  async getReservationNotifications(id: string): Promise<ReservationNotification[]> {
    const { data } = await api.get<ReservationNotification[]>(`/reservations/${encodeURIComponent(id)}/notifications`);
    return data;
  },

  async getAdminReservationNotifications(id: string): Promise<ReservationAdminNotification[]> {
    const { data } = await api.get<ReservationAdminNotification[]>(`/admin/reservations/${encodeURIComponent(id)}/notifications`);
    return data;
  },

  async retryReservationNotification(notificationId: string): Promise<ReservationNotification> {
    const { data } = await api.post<ReservationNotification>(`/admin/reservation-notifications/${encodeURIComponent(notificationId)}/retry`);
    return data;
  },

  async getScheduleTemplates(): Promise<ScheduleTemplate[]> {
    const { data } = await api.get<ScheduleTemplate[]>("/schedule-templates");
    return data;
  },

  async getScheduleTemplate(id: string): Promise<ScheduleTemplate> {
    const { data } = await api.get<ScheduleTemplate>(`/schedule-templates/${encodeURIComponent(id)}`);
    return data;
  },

  async getScheduleTemplatesByActivity(activityId: string): Promise<ScheduleTemplate[]> {
    const { data } = await api.get<ScheduleTemplate[]>(`/schedule-templates/activity/${encodeURIComponent(activityId)}`);
    return data;
  },

  async createScheduleTemplate(request: ScheduleTemplateRequest): Promise<ScheduleTemplate> {
    const { data } = await api.post<ScheduleTemplate>("/schedule-templates", request);
    return data;
  },

  async updateScheduleTemplate(id: string, request: ScheduleTemplateRequest): Promise<ScheduleTemplate> {
    const { data } = await api.put<ScheduleTemplate>(`/schedule-templates/${encodeURIComponent(id)}`, request);
    return data;
  },

  async deactivateScheduleTemplate(id: string): Promise<void> {
    await api.delete(`/schedule-templates/${encodeURIComponent(id)}`);
  },

  async generateSlots(templateId: string, request: GenerateSlotsRequest): Promise<AvailabilityResponse[]> {
    const { data } = await api.post<AvailabilityResponse[]>("/time-slots/generate", request, {
      params: { templateId },
    });
    return data;
  },

  async updateTimeSlotStatus(id: string, status: TimeSlotStatus, reason?: string): Promise<AvailabilityResponse> {
    const { data } = await api.patch<AvailabilityResponse>(
      `/time-slots/${encodeURIComponent(id)}/status`,
      undefined,
      { params: { status, ...(reason?.trim() ? { reason: reason.trim() } : {}) } },
    );
    return data;
  },

  async getTimeSlotHistory(id: string): Promise<TimeSlotHistoryResponse[]> {
    const { data } = await api.get<TimeSlotHistoryResponse[]>(`/time-slots/${encodeURIComponent(id)}/history`);
    return data;
  },

  async createTimeSlotException(request: TimeSlotExceptionRequest): Promise<AvailabilityResponse> {
    const { data } = await api.post<AvailabilityResponse>("/time-slots/exceptions", request);
    return data;
  },

  async closeTimeSlots(request: TimeSlotClosureRequest): Promise<AvailabilityResponse[]> {
    const { data } = await api.post<AvailabilityResponse[]>("/time-slots/closures", request);
    return data;
  },

  async updateTimeSlot(id: string, request: TimeSlotUpdateRequest): Promise<AvailabilityResponse> {
    const { data } = await api.patch<AvailabilityResponse>(`/time-slots/${encodeURIComponent(id)}`, request);
    return data;
  },
};