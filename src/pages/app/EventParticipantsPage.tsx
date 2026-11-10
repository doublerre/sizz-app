import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

type Participant = {
  id: string;
  name: string;
  email: string;
  status: string;
};

export default function EventParticipantsPage() {
  const { id } = useParams();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/events/${id}/participants`)
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 404) {
            return [] as Participant[];
          }
          throw new Error("No se pudieron cargar los inscritos");
        }
        return (await response.json()) as Participant[];
      })
      .then((data) => {
        if (!cancelled) setParticipants(data);
      })
      .catch(() => {
        if (!cancelled) setError("No pudimos cargar los inscritos.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="container" style={{ padding: "2rem 1rem" }}>
      <Link to="/app/eventos">← Volver a eventos</Link>
      <h1 style={{ marginTop: "1rem" }}>Inscritos del evento</h1>

      {loading ? (
        <p>Cargando inscritos...</p>
      ) : error ? (
        <p>{error}</p>
      ) : participants.length === 0 ? (
        <p>Aún no hay participantes registrados para este evento.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
          {participants.map((participant) => (
            <li key={participant.id} style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: "0.9rem 1rem" }}>
              <strong>{participant.name}</strong>
              <div>{participant.email}</div>
              <small>{participant.status}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
