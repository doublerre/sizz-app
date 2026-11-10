
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, Users } from "lucide-react";
import { getEvent, type ApiEvent } from "@/services/eventsApi";
import { getCategoryStyle } from "@/data/eventCategories";
import { formatCost, formatLongDate, formatTimeRange } from "@/utils/eventFormat";
import "./EventDetailPage.css";
import EventRegistrationForm from "@/components/EventRegistrationForm";

type Result = {
    id: string;
    event: ApiEvent | null;
    finished: boolean;
};

export default function EventDetailPage() {
    const { id } = useParams();
    const [result, setResult] = useState<Result | null>(null);

    useEffect(() => {
        if (!id) return;

        let cancelled = false;

        getEvent(id)
            .then((event) => {
                if (cancelled) return;

                const reference = event.endDate ?? event.startDate;
                const finished =
                    reference !== null &&
                    new Date(reference).getTime() < Date.now();

                setResult({ id, event, finished });
            })
            .catch(() => {
                if (!cancelled) {
                    setResult({ id, event: null, finished: false });
                }
            });

        return () => {
            cancelled = true;
        };
    }, [id]);

    const loading = result === null || result.id !== id;

    if (loading) {
        return (
            <div className="container">
                <p className="event-detail-message">Cargando evento...</p>
            </div>
        );
    }

    if (!result.event) {
        return (
            <div className="container event-detail-missing">
                <h1>No encontramos este evento</h1>
                <p>Puede que ya no esté disponible o que el enlace sea incorrecto.</p>

                <Link
                    to="/eventos"
                    className="event-detail-back event-detail-back--dark"
                >
                    <ArrowLeft size={16} /> Ver todos los eventos
                </Link>
            </div>
        );
    }

    const { event, finished } = result;
    const category = getCategoryStyle(event.category);
    const Icon = category.icon;

    return (
        <div
            className="event-detail"
            style={{ "--event-color": category.color } as CSSProperties}
        >
            <header className="event-detail-hero">
                <div className="container">
                    <Link to="/eventos" className="event-detail-back">
                        <ArrowLeft size={16} /> Volver a eventos
                    </Link>

                    <span className="event-detail-category">
                        <span className="event-detail-category-icon">
                            <Icon size={16} />
                        </span>
                        {category.name}
                    </span>

                    <h1>{event.title}</h1>

                    {event.audience && (
                        <p className="event-detail-audience">
                            {event.audience}
                        </p>
                    )}
                </div>
            </header>

            <div className="container event-detail-body">
                <section className="event-detail-main">
                    <h2>Sobre este evento</h2>
                    <p>
                        {event.description ??
                            "Pronto compartiremos más detalles de este evento."}
                    </p>
                </section>

                <aside className="event-detail-card">
                    {finished && (
                        <p className="event-detail-finished">
                            Este evento ya terminó.
                        </p>
                    )}

                    <dl className="event-detail-facts">
                        <div>
                            <dt>
                                <CalendarDays size={16} /> Fecha
                            </dt>
                            <dd>{formatLongDate(event.startDate)}</dd>
                        </div>

                        <div>
                            <dt>
                                <Clock size={16} /> Horario
                            </dt>
                            <dd>
                                {formatTimeRange(
                                    event.startDate,
                                    event.endDate
                                )}
                            </dd>
                        </div>

                        {event.venue && (
                            <div>
                                <dt>
                                    <MapPin size={16} /> Sede
                                </dt>
                                <dd>{event.venue}</dd>
                            </div>
                        )}

                        {event.capacity !== null && (
                            <div>
                                <dt>
                                    <Users size={16} /> Aforo
                                </dt>
                                <dd>{event.capacity} personas</dd>
                            </div>
                        )}

                        <div>
                            <dt>
                                <Ticket size={16} /> Costo
                            </dt>
                            <dd>{formatCost(event.cost)}</dd>
                        </div>
                    </dl>

                    {finished ? null : (
                        <EventRegistrationForm eventId={event.id} />
                    )}
                </aside>
            </div>
        </div>
    );
}
