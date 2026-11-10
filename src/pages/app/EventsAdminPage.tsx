import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getEvents, type ApiEvent } from "@/services/eventsApi";

type EventDraft = {
  id?: string;
  title: string;
  description: string;
  category: string;
  audience: string;
  venue: string;
  startDate: string;
  endDate: string;
  capacity: string;
  cost: string;
  status: ApiEvent["status"];
};

const emptyDraft: EventDraft = {
  title: "",
  description: "",
  category: "",
  audience: "",
  venue: "",
  startDate: "",
  endDate: "",
  capacity: "",
  cost: "0",
  status: "DRAFT",
};

export default function EventsAdminPage() {
  const [events, setEvents] = useState<ApiEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<EventDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadEvents = () => {
    setLoading(true);
    getEvents()
      .then(setEvents)
      .catch(() => setError("No se pudieron cargar los eventos."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? "")),
    [events],
  );

  const submitEvent = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextEvent = {
      ...draft,
      id: editingId ?? crypto.randomUUID(),
      capacity: draft.capacity === "" ? null : Number(draft.capacity),
      cost: Number(draft.cost || 0),
    };

    setEvents((current) => {
      if (editingId) {
        return current.map((item) => (item.id === editingId ? { ...item, ...nextEvent } : item));
      }
      return [
        {
          id: nextEvent.id ?? crypto.randomUUID(),
          title: nextEvent.title,
          description: nextEvent.description || null,
          category: nextEvent.category || null,
          audience: nextEvent.audience || null,
          venue: nextEvent.venue || null,
          startDate: nextEvent.startDate || null,
          endDate: nextEvent.endDate || null,
          capacity: nextEvent.capacity,
          cost: nextEvent.cost,
          status: nextEvent.status,
        },
        ...current,
      ];
    });

    setDraft(emptyDraft);
    setEditingId(null);
    setError("");
  };

  const onDelete = (id: string) => {
    setEvents((current) => current.filter((event) => event.id !== id));
  };

  const onPublish = (id: string) => {
    setEvents((current) =>
      current.map((event) =>
        event.id === id ? { ...event, status: event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" } : event,
      ),
    );
  };

  const startEdit = (event: ApiEvent) => {
    setEditingId(event.id);
    setDraft({
      id: event.id,
      title: event.title,
      description: event.description ?? "",
      category: event.category ?? "",
      audience: event.audience ?? "",
      venue: event.venue ?? "",
      startDate: event.startDate ?? "",
      endDate: event.endDate ?? "",
      capacity: event.capacity?.toString() ?? "",
      cost: String(event.cost),
      status: event.status,
    });
  };

  return (
    <div className="container" style={{ padding: "2rem 1rem", display: "grid", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
        <h1>Eventos Admin</h1>
      </div>

      <form onSubmit={submitEvent} style={{ display: "grid", gap: "0.75rem", background: "#f8fafc", padding: "1rem", borderRadius: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
          <input value={draft.title} onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))} placeholder="Título" required />
          <input value={draft.category} onChange={(e) => setDraft((current) => ({ ...current, category: e.target.value }))} placeholder="Categoría" />
          <input value={draft.audience} onChange={(e) => setDraft((current) => ({ ...current, audience: e.target.value }))} placeholder="Audiencia" />
          <input value={draft.venue} onChange={(e) => setDraft((current) => ({ ...current, venue: e.target.value }))} placeholder="Lugar" />
          <input type="datetime-local" value={draft.startDate} onChange={(e) => setDraft((current) => ({ ...current, startDate: e.target.value }))} />
          <input type="datetime-local" value={draft.endDate} onChange={(e) => setDraft((current) => ({ ...current, endDate: e.target.value }))} />
          <input type="number" min={0} value={draft.capacity} onChange={(e) => setDraft((current) => ({ ...current, capacity: e.target.value }))} placeholder="Capacidad" />
          <input type="number" min={0} step="0.01" value={draft.cost} onChange={(e) => setDraft((current) => ({ ...current, cost: e.target.value }))} placeholder="Costo" />
          <select value={draft.status} onChange={(e) => setDraft((current) => ({ ...current, status: e.target.value as ApiEvent["status"] }))}>
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicado</option>
            <option value="CLOSED">Cerrado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <textarea value={draft.description} onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))} placeholder="Descripción" rows={4} />

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button type="submit" className="btn btn-primary">{editingId ? "Guardar cambios" : "Nuevo evento"}</button>
          {editingId && (
            <button type="button" className="btn btn-secondary" onClick={() => { setEditingId(null); setDraft(emptyDraft); }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {loading ? (
        <p>Cargando eventos...</p>
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {sortedEvents.length === 0 ? (
            <p>No hay eventos registrados.</p>
          ) : (
            sortedEvents.map((event) => (
              <div key={event.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "1rem", display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
                  <div>
                    <strong>{event.title}</strong>
                    <div>{event.category ?? "Sin categoría"}</div>
                  </div>
                  <span style={{ borderRadius: 999, background: "#e0f2fe", padding: "0.3rem 0.7rem" }}>{event.status}</span>
                </div>
                <div>{event.description ?? "Sin descripción"}</div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => startEdit(event)}>Editar</button>
                  <button type="button" onClick={() => onPublish(event.id)}>Publicar</button>
                  <Link to={`/app/eventos/${event.id}/inscritos`}>Inscritos</Link>
                  <button type="button" onClick={() => onDelete(event.id)}>Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
