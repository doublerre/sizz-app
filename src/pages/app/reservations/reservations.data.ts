export const reservationStatusLabels: Record<string, string> = {
  PENDING: "Pendiente",
  PENDING_VALIDATION: "Pendiente de validación",
  CONFIRMED: "Confirmada",
  ATTENDED: "Asistió",
  CANCELLED: "Cancelada",
  NO_SHOW: "No se presentó",
};

export const dateLabel = (value: string | null) =>
  value
    ? new Date(
        value.length === 10 ? `${value}T12:00:00` : value,
      ).toLocaleDateString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export const timeLabel = (value: string | null) =>
  value ? value.slice(0, 5) : "—";
