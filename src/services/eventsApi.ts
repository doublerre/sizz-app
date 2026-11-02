import api from "./api";

export type ApiEvent = {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    audience: string | null;
    venue: string | null;
    startDate: string | null;   // llega como texto: "2026-10-12T19:00:00Z"
    endDate: string | null;
    capacity: number | null;
    cost: number;
    status: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED";
};

export async function getEvents(): Promise<ApiEvent[]> {
    const response = await fetch("/api/events");
    if (!response.ok) {
        throw new Error("No se pudieron cargar los eventos");
    }
    return response.json();
}

export async function getEvent(id: string): Promise<ApiEvent> {
    const response = await fetch(`/api/events/${id}`);
    if (!response.ok) {
        throw new Error("No se pudo cargar el evento");
    }
    return response.json();
}

// Lo que se manda al crear un evento (coincide con EventRequest del backend)
export type EventPayload = {
    title: string;
    description: string | null;
    category: string | null;
    audience: string | null;
    venue: string | null;
    startDate: string | null;
    endDate: string | null;
    capacity: number | null;
    cost: number;
};

// Todos los eventos
export async function getAllEvents(): Promise<ApiEvent[]> {
    const { data } = await api.get<ApiEvent[]>("/events/manage");
    return data;
}

// El evento queda como borrador
export async function createEvent(payload: EventPayload): Promise<ApiEvent> {
    const { data } = await api.post<ApiEvent>("/events", payload);
    return data;
}

export async function publishEvent(id: string): Promise<ApiEvent> {
    const { data } = await api.patch<ApiEvent>(`/events/${id}/publish`);
    return data;
}
export async function updateEvent(id: string, payload: EventPayload): Promise<ApiEvent> {
    const { data } = await api.put<ApiEvent>(`/events/${id}`, payload);
    return data;
}


export async function deleteEvent(id: string): Promise<void> {
    await api.delete(`/events/${id}`);
}