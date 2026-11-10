import { Outlet } from "react-router-dom";
import {
  isTicketbootBackendEnabled,
  ticketbootUnavailableMessage,
} from "@/services/ticketboot.config";
import "./BoxOfficePage.css";

export default function BoxOfficePage() {
  if (!isTicketbootBackendEnabled) {
    return (
      <main className="ticketboot-unavailable">
        <section className="ticketboot-unavailable__message" role="status">
          <h1>Taquilla temporalmente no disponible</h1>
          <p>{ticketbootUnavailableMessage}</p>
          <p>No se registrarán ventas, aperturas, cierres ni cancelaciones mientras tanto.</p>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
