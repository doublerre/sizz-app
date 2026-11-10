import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { getAllEvents, getParticipants, type ApiEvent, type Participant } from "@/services/eventsApi";
import "./EventsAdminPage.css";

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

// Excel necesita el BOM para mostrar bien los acentos
function downloadCsv(event: ApiEvent | null, participants: Participant[]) {
    // Excel ejecuta como fórmula lo que empieza con = + - @ ; el apóstrofo lo vuelve texto
    const quote = (v: string | null) => {
        const text = v ?? "";
        const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
        return `"${safe.replace(/"/g, '""')}"`;
    };
    const rows = [
        ["Folio", "Nombre", "Correo", "Teléfono", "Fecha de inscripción"],
        ...participants.map((p) => [p.folio, p.name, p.email, p.phone, formatDate(p.registeredAt)]),
    ];
    const csv = "\uFEFF" + rows.map((r) => r.map(quote).join(",")).join("\n");
    const link = document.createElement("a");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    link.href = url;
    link.download = `inscritos-${(event?.title ?? "evento").toLowerCase().replace(/\s+/g, "-")}.csv`;
    link.click();
    // Se libera un momento después: revocarla de inmediato puede cancelar la descarga en algunos navegadores
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function EventParticipantsPage() {
    const { id } = useParams();
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [event, setEvent] = useState<ApiEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) return;
        // Si el usuario sale antes de que responda la API, no se actualiza el estado
        let cancelled = false;

        Promise.all([getParticipants(id), getAllEvents()])
            .then(([people, events]) => {
                if (cancelled) return;
                setParticipants(people);
                setEvent(events.find((e) => e.id === id) ?? null);
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

    const capacity = event?.capacity ?? null;

    return (
        <div className="admin-event-page">
            <header className="admin-event-header">
                <div>
                    <Link to="/app/eventos" className="admin-event-sub">
                        <ArrowLeft size={14} /> Volver a eventos
                    </Link>
                    <h1>Inscritos</h1>
                    <p>{event?.title ?? "Evento"}</p>
                </div>
                <button
                    type="button"
                    className="admin-event-btn"
                    disabled={participants.length === 0}
                    onClick={() => downloadCsv(event, participants)}
                >
                    <Download size={18} /> Exportar CSV
                </button>
            </header>

            <section className="admin-event-stats">
                <div className="admin-event-stat">
                    <span>Inscritos</span>
                    <strong>{participants.length}</strong>
                </div>
                <div className="admin-event-stat">
                    <span>Aforo</span>
                    <strong>{capacity ?? "Sin límite"}</strong>
                </div>
                <div className="admin-event-stat">
                    <span>Lugares disponibles</span>
                    <strong>{capacity === null ? "—" : Math.max(capacity - participants.length, 0)}</strong>
                </div>
            </section>

            <section className="admin-event-card">
                {loading ? (
                    <p className="admin-event-empty">Cargando inscritos...</p>
                ) : error ? (
                    <p className="admin-event-empty">{error}</p>
                ) : participants.length === 0 ? (
                    <p className="admin-event-empty">Todavía no hay inscritos en este evento.</p>
                ) : (
                    <div className="admin-event-table-wrap">
                        <table className="admin-event-table">
                            <thead>
                                <tr>
                                    <th>Folio</th>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Teléfono</th>
                                    <th>Inscripción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {participants.map((p) => (
                                    <tr key={p.id}>
                                        <td>
                                            <strong>{p.folio}</strong>
                                        </td>
                                        <td>{p.name}</td>
                                        <td>{p.email}</td>
                                        <td>{p.phone ?? "—"}</td>
                                        <td>{formatDate(p.registeredAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}