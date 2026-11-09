export const isTicketbootBackendEnabled =
  import.meta.env.VITE_TICKETBOOT_BACKEND_ENABLED === "true";

export const ticketbootUnavailableMessage =
  "Las funciones de taquilla están temporalmente deshabilitadas hasta que se despliegue una API compatible.";

export function assertTicketbootBackendEnabled(): void {
  if (!isTicketbootBackendEnabled) {
    throw new Error(ticketbootUnavailableMessage);
  }
}
