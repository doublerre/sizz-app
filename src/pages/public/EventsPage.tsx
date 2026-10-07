import { Link } from "react-router-dom";
import "./EventsPage.css"
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { Atom, Orbit, ScanEye, Baby, TreePine, Share2, Sparkles, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getEvents, type ApiEvent } from "@/services/eventsApi";

// Categorías del diseño con su color y su ícono.
type CategoryStyle = { name: string; color: string; icon: LucideIcon };

const categories: CategoryStyle[] = [
    { name: "Física", color: "var(--brand-blue)", icon: Atom },
    { name: "Astronomía", color: "var(--brand-green)", icon: Orbit },
    { name: "Óptica", color: "var(--brand-red-light)", icon: ScanEye },
    { name: "Infantil", color: "var(--brand-yellow)", icon: Baby },
    { name: "Ambiente", color: "var(--brand-teal)", icon: TreePine },
    { name: "Tecnología", color: "var(--brand-purple)", icon: Share2 },
];

// Colores disponibles para categorías que no están en la lista
const palette = [
    "var(--brand-blue)",
    "var(--brand-purple)",
    "var(--brand-green)",
    "var(--brand-yellow)",
    "var(--brand-red-light)",
];

// Quita acentos y mayusculas para comprobar textos y
// quedan iguales. normalize("NFD") separa cada letra de su acento y el
// replace borra los acentos sueltos.
function normalize(text: string): string {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// Convierte el nombre de la categoría en un número y lo usa para elegir
// un color de la paleta
function fallbackColor(category: string): string {
    let hash = 0;
    for (const char of category) {
        hash = (hash * 31 + char.charCodeAt(0)) % 1000003;
    }
    return palette[hash % palette.length];
}

// Busca la categoría sin importar acentos ni mayúsculas.
function getCategoryStyle(category: string | null): CategoryStyle {
    const name = category ?? "General";
    const found = categories.find((c) => normalize(c.name) === normalize(name));
    return found ?? { name, color: fallbackColor(name), icon: Sparkles };
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

function formatCost(cost: number): string {
    if (cost === 0) return "Gratis";
    return cost.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
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
        // Cada palabra se busca por separado
        const words = normalize(debouncedSearch).split(/\s+/).filter(Boolean);
        const text = normalize(`${event.title} ${event.category ?? ""}`);
        return words.every((word) => text.includes(word));
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
                            const category = getCategoryStyle(event.category);
                            const Icon = category.icon;
                            return (
                                // --event-color es una variable CSS: el .css la usa para
                                // pintar el banner y las pastillas con un solo color
                                <article
                                    className="event-card"
                                    key={event.id}
                                    style={{ "--event-color": category.color } as CSSProperties}
                                >
                                    <div className="event-banner">
                                        <div className="event-circle"></div>
                                        <span className="event-category">{category.name}</span>
                                        <div className="event-icon">
                                            <Icon size={22} />
                                        </div>
                                    </div>
                                    <div className="event-body">
                                        <h3>{event.title}</h3>
                                        {event.description && (
                                            <p className="event-description">{event.description}</p>
                                        )}
                                        <div className="event-tags">
                                            {event.audience && (
                                                <span className="event-tag event-tag-audience">{event.audience}</span>
                                            )}
                                            <span className="event-tag">{formatDate(event.startDate)}</span>
                                        </div>
                                        <div className="event-footer">
                                            <span className={event.cost === 0 ? "event-cost event-cost-free" : "event-cost"}>
                                                {formatCost(event.cost)}
                                            </span>
                                            <Link className="event-link" to={"/eventos/" + event.id}>
                                                Ver detalle <ArrowRight size={14} />
                                            </Link>
                                        </div>
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