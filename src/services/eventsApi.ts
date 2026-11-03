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