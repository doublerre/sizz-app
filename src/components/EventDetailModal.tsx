import { useCallback, useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { CalendarDays, Clock, MapPin, Ticket, Users, X } from "lucide-react";
import type { ApiEvent } from "@/services/eventsApi";
import { getCategoryStyle } from "@/data/eventCategories";
import { formatCost, formatLongDate, formatTimeRange } from "@/utils/eventFormat";
import EventRegistrationForm from "@/components/EventRegistrationForm";
import "./EventDetailModal.css";

export default function EventDetailModal({
    event,
    onClose,
    goToForm = false,
}: {
    event: ApiEvent;
    onClose: () => void;
    goToForm?: boolean;
}) {
    const category = getCategoryStyle(event.category);
    const Icon = category.icon;
    // Si se abrió con el botón Inscribirme, el cursor queda en el formulario
    // (y en celular, donde el formulario queda abajo, la ventana baja hasta él)
    const registerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (goToForm) registerRef.current?.querySelector("input")?.focus();
    }, [goToForm]);

    // true cuando hay datos escritos en el formulario sin enviar
    const dirtyRef = useRef(false);
    const handleDirtyChange = useCallback((dirty: boolean) => {
        dirtyRef.current = dirty;
    }, []);

    const requestClose = useCallback(() => {
        if (dirtyRef.current && !window.confirm("Tienes datos escritos sin enviar. ¿Cerrar y perderlos?")) return;
        onClose();
    }, [onClose]);

    useEffect(() => {
        const closeOnEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") requestClose();
        };
        document.addEventListener("keydown", closeOnEscape);

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        const previous = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.removeEventListener("keydown", closeOnEscape);
            document.body.style.overflow = previous.overflow;
            document.body.style.paddingRight = previous.paddingRight;
        };
    }, [requestClose]);

    return (
        <div className="event-modal-backdrop" onClick={requestClose}>
            <div
                className="event-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-modal-title"
                style={{ "--event-color": category.color } as CSSProperties}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="event-modal-header">
                    <button type="button" className="event-modal-close" aria-label="Cerrar" onClick={requestClose}>
                        <X size={20} />
                    </button>
                    <span className="event-modal-category">
                        <span className="event-modal-category-icon">
                            <Icon size={14} />
                        </span>
                        {category.name}
                    </span>
                    <h2 id="event-modal-title">{event.title}</h2>
                    {event.audience && <p>{event.audience}</p>}
                </header>

                <div className="event-modal-body">
                    <div className="event-modal-info">
                        {event.description && <p className="event-modal-description">{event.description}</p>}
                        <dl className="event-modal-facts">
                            <div>
                                <dt>
                                    <CalendarDays size={15} /> Fecha
                                </dt>
                                <dd>{formatLongDate(event.startDate)}</dd>
                            </div>
                            <div>
                                <dt>
                                    <Clock size={15} /> Horario
                                </dt>
                                <dd>{formatTimeRange(event.startDate, event.endDate)}</dd>
                            </div>
                            {event.venue && (
                                <div>
                                    <dt>
                                        <MapPin size={15} /> Sede
                                    </dt>
                                    <dd>{event.venue}</dd>
                                </div>
                            )}
                            {event.capacity !== null && (
                                <div>
                                    <dt>
                                        <Users size={15} /> Aforo
                                    </dt>
                                    <dd>{event.capacity} personas</dd>
                                </div>
                            )}
                            <div>
                                <dt>
                                    <Ticket size={15} /> Costo
                                </dt>
                                <dd>{formatCost(event.cost)}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="event-modal-register" ref={registerRef}>
                        <EventRegistrationForm eventId={event.id} onDirtyChange={handleDirtyChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}