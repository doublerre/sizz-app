import type { FieldType } from "../services/scholarship.types";

export const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  OPEN: "Abierta",
  PAUSED: "Pausada",
  CLOSED: "Cerrada",
  SUBMITTED: "En revisión",
  DOCUMENTS_INCOMPLETE: "Corregir documentos",
  VALIDATED: "Validada",
  REJECTED: "Rechazada",
  AWARDED: "Beca otorgada",
  PENDING: "Pendiente",
  APPROVED: "Aprobado",
  ELIGIBLE: "Cumple mínimo",
  INELIGIBLE: "Bajo el mínimo",
  RECORDED: "Validado",
  INCIDENT: "Falta salida",
  RESOLVED_WITH_HOURS: "Resuelta",
  RESOLVED_ZERO: "Resuelta sin horas",
  ABSENT: "Sin checadas",
};
export const applicationTypes = {
  NEW_ENTRY: "Nuevo ingreso",
  RENEWAL: "Renovación",
};
export const fieldTypes: Record<FieldType, string> = {
  SHORT_TEXT: "Texto corto",
  PARAGRAPH: "Párrafo",
  NUMBER: "Número",
  DATE: "Fecha",
  TIME: "Hora",
  PHONE: "Teléfono",
  EMAIL: "Correo",
  SINGLE_SELECT: "Selección simple",
  MULTI_SELECT: "Selección múltiple",
  YES_NO: "Sí / No",
  FILE: "Documento",
};
export const money = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
    value,
  );
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

export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
