import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getEvents, type ApiEvent } from "@/services/eventsApi";

function formatDateTime(value: string | null) {
  if (!value) return "Fecha por definir";
  const date = new Date(value);
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function formatCost(cost: number) {
  if (cost === 0) return "Gratis";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cost);
}

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState<ApiEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    getEvents()
      .then((events) => {
        if (cancelled) return;
        const selected = events.find((item) => item.id === id) ?? null;
        if (!selected) {
          setError("No se encontró el evento solicitado.");
          return;
        }
        setEvent(selected);
      })
      .catch(() => {
        if (!cancelled) {
          setError("No pudimos cargar la información del evento.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="container" style={{ padding: "2rem 1rem" }}>Cargando evento...</div>;
  }

  if (error || !event) {
    return (
      <div className="container" style={{ padding: "2rem 1rem" }}>
        <p>{error || "No se encontró el evento."}</p>
        <Link to="/eventos">Volver a eventos</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "2rem 1rem" }}>
      <Link to="/eventos">← Volver a eventos</Link>
      <article style={{ marginTop: "1.5rem", display: "grid", gap: "1rem" }}>
        <div>
          <p style={{ textTransform: "uppercase", letterSpacing: 1.2, fontSize: 12, opacity: 0.7 }}>
            {event.category ?? "Evento"}
          </p>
          <h1>{event.title}</h1>
        </div>

        {event.description && <p>{event.description}</p>}

        <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div><strong>Inicio:</strong> {formatDateTime(event.startDate)}</div>
          <div><strong>Fin:</strong> {formatDateTime(event.endDate)}</div>
          <div><strong>Ubicación:</strong> {event.venue ?? "Por definir"}</div>
          <div><strong>Audiencia:</strong> {event.audience ?? "General"}</div>
          <div><strong>Costo:</strong> {formatCost(event.cost)}</div>
          <div><strong>Capacidad:</strong> {event.capacity ?? "Sin límite"}</div>
          <div><strong>Estado:</strong> {event.status}</div>
        </div>
      </article>
    </div>
  );
}
