export function formatCost(cost: number): string {
    if (cost === 0) return "Gratis";
    return cost.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

// "Viernes, 20 de noviembre de 2026"
export function formatLongDate(iso: string | null): string {
    if (!iso) return "Fecha por definir";
    const text = new Date(iso).toLocaleDateString("es-MX", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    return text.charAt(0).toUpperCase() + text.slice(1);
}

const hour = (iso: string) =>
    new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });


export function formatTimeRange(start: string | null, end: string | null): string {
    if (!start) return "Horario por definir";
    if (!end) return `${hour(start)} h`;
    const sameDay = new Date(start).toDateString() === new Date(end).toDateString();
    if (sameDay) return `${hour(start)} – ${hour(end)} h`;
    const endDay = new Date(end).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
    return `${hour(start)} h (termina el ${endDay}, ${hour(end)} h)`;
}