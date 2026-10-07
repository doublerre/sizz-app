import { Link } from "react-router-dom";
import "./EventsPage.css"
import { useState, useEffect } from "react";
import { getEvents, type ApiEvent } from "@/services/eventsApi";

// La API no manda color, así que se decide aquí según la categoría.
// Solo variables de index.css, nunca hexadecimales.
const categoryColors: Record<string, string> = {
    "Astronomía": "var(--brand-blue)",
    "Tecnología": "var(--brand-purple)",
    "Evento Especial": "var(--brand-green)",
    "Infantil": "var(--brand-yellow)",
    "Óptica": "var(--brand-red-light)",
};

// Colores disponibles para categorías que no están en categoryColors
const palette = [
    "var(--brand-blue)",
    "var(--brand-purple)",
    "var(--brand-green)",
    "var(--brand-yellow)",
    "var(--brand-red-light)",
];

// Convierte el nombre de la categoría en un número y lo usa para elegir
// un color de la paleta. Así la misma categoría siempre sale del mismo
// color, sin tener que registrarla a mano.
function fallbackColor(category: string | null): string {
    if (!category) return palette[0];
    let hash = 0;
    for (const char of category) {
        hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
    }
    return palette[hash % palette.length];
}

// La API entrega la fecha y la hora juntas en un solo texto ISO.
// El navegador la convierte a la zona horaria de quien la ve.
function formatDate(iso: string | null): string {
    if (!iso) return "Fecha por definir";
    const date = new Date(iso);
    const day = date.toLocaleDateString("es-MX", { day: "numeric", month: "short" }).toUpperCase();
    const time = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });
    return `${day} · ${time}`;
}

export default function EventsPage() {
    const [events, setEvents] = useState<ApiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Carga única al abrir la página ([] = sin dependencias)
    useEffect(() => {
        // Si el usuario sale de la página antes de que responda la API,
        // no se actualiza el estado de un componente que ya no existe
        let cancelled = false;

        getEvents()
            .then((data) => {
                if (!cancelled) setEvents(data);
            })
            .catch(() => {
                if (!cancelled) setError("No pudimos cargar los eventos. Intenta de nuevo más tarde.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const filteredEvents = events.filter((event) => {
        const query = debouncedSearch.toLowerCase();
        // category puede venir vacía (null) desde la base de datos
        return (
            event.title.toLowerCase().includes(query) ||
            (event.category ?? "").toLowerCase().includes(query)
        );
    });

    return (
        <>
            <header className="events-header">
                <div className="container">
                    <p className="events-eyebrow">AGENDA ZIGZAG</p>
                    <h1>Eventos para descubrir juntos</h1>
                    <p className="events-subtitle">Actividades especiales, talleres y noches temáticas para toda la familia</p>
                </div>

            </header>
            <section className="events-intro">
                <div className="container">
                    <h2>Próximos eventos</h2>
                    <p className="events-intro-text">Consulta fechas, edades y requisitos de acceso.</p>
                </div>
            </section>
            <div className="events-filters-wrapper">
                <div className="container">
                    <div className="events-filters">
                        <input
                            type="text"
                            className="events-search"
                            placeholder="Buscar evento o tema..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
            <div className="container">
                {loading ? (
                    <p className="events-empty">Cargando eventos...</p>
                ) : error ? (
                    <p className="events-empty">{error}</p>
                ) : filteredEvents.length > 0 ? (
                    <div className="events-grid">
                        {filteredEvents.map((event) => {
                            const color = categoryColors[event.category ?? ""] ?? fallbackColor(event.category);
                            return (
                                <article className="event-card" key={event.id}>
                                    <div className="event-banner" style={{ backgroundColor: color }}>
                                        <div className="event-circle"></div>
                                        <span className="event-category" style={{ color: color }}>{event.category ?? "General"}</span>
                                    </div>
                                    <div className="event-body">
                                        <h3>{event.title}</h3>
                                        <p className="event-date" style={{ color: color }}>{formatDate(event.startDate)}</p>
                                        {event.audience && <p className="audience">{event.audience}</p>}
                                        <Link className="event-link" to={"/eventos/" + event.id}>Consultar detalles</Link>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="events-empty">
                        {events.length === 0
                            ? "Por ahora no hay eventos publicados."
                            : "No encontramos eventos que coincidan con tu búsqueda."}
                    </p>
                )}
            </div>
        </>
    )
}