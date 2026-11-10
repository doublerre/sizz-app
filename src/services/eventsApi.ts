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


// Se inscribe con nombre y correo, sin cuenta
export type RegistrationPayload = {
    name: string;
    email: string;
    phone: string | null;
    privacyAccepted: boolean;
};

// emailSent: false si el correo no pudo salir la inscripcion si se quedara 
export type RegistrationResult = {
    folio: string;
    eventTitle: string;
    email: string;
    emailSent: boolean;
};

export type Participant = {
    id: string;
    folio: string;
    name: string;
    email: string;
    phone: string | null;
    registeredAt: string;
};

export async function registerToEvent(eventId: string, payload: RegistrationPayload): Promise<RegistrationResult> {
    const response = await fetch(`/api/events/${eventId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        // El backend responde { code, message, details: [{ field, message }] }
        const details = Array.isArray(data?.details) ? data.details.map((d: { message: string }) => d.message).join(" ") : "";
        throw new Error(details || data?.message || "No pudimos completar tu inscripción. Intenta de nuevo.");
    }
    return data as RegistrationResult;
}

// Solo ADMIN y CONTROL
export async function getParticipants(eventId: string): Promise<Participant[]> {
    const { data } = await api.get<Participant[]>(`/events/${eventId}/registrations`);
    return data;
}