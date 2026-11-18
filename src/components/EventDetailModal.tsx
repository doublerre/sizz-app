import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, Users, X } from "lucide-react";
import type { ApiEvent } from "@/services/eventsApi";
import { getCategoryStyle } from "@/data/eventCategories";
import { formatCost, formatLongDate, formatTimeRange, hasEnded } from "@/utils/eventFormat";
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
    const finished = hasEnded(event.startDate, event.endDate);

    // Dos pasos en la misma ventana: primero la información y luego el formulario
    const [step, setStep] = useState<"info" | "form">(goToForm && !finished ? "form" : "info");

    const modalRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const bodyRef = useRef<HTMLDivElement>(null);
    const ctaRef = useRef<HTMLButtonElement>(null);
    const registerRef = useRef<HTMLDivElement>(null);
    const opened = useRef(false);

    // Al cerrar, el foco regresa al botón que abrió el modal
    useEffect(() => {
        const opener = document.activeElement as HTMLElement | null;
        return () => opener?.focus();
    }, []);

    // Al cambiar de paso: arriba del todo y el foco donde corresponde
    useEffect(() => {
        bodyRef.current?.scrollTo({ top: 0 });
        if (step === "form") registerRef.current?.querySelector("input")?.focus();
        else (opened.current ? ctaRef.current : closeRef.current)?.focus();
        opened.current = true;
    }, [step]);

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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") return requestClose();
            if (e.key !== "Tab" || !modalRef.current) return;

            // Tab no sale del modal; se saltan los elementos del paso oculto
            const focusables = [
                ...modalRef.current.querySelectorAll<HTMLElement>(
                    "button:not([disabled]), input:not([disabled]), select, textarea, a[href]"
                ),
            ].filter((el) => !el.closest("[hidden]"));
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener("keydown", handleKeyDown);

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        const previous = { overflow: document.body.style.overflow, paddingRight: document.body.style.paddingRight };
        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;

        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = previous.overflow;
            document.body.style.paddingRight = previous.paddingRight;
        };
    }, [requestClose]);

    return (
        <div className="event-modal-backdrop" onClick={requestClose}>
            <div
                className="event-modal"
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="event-modal-title"
                style={{ "--event-color": category.color } as CSSProperties}
                onClick={(e) => e.stopPropagation()}
            >
                <header className="event-modal-header">
                    <button type="button" className="event-modal-close" ref={closeRef} aria-label="Cerrar" onClick={requestClose}>
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

                <div className="event-modal-body" ref={bodyRef}>
                    {/* Paso 1: información del evento */}
                    <div hidden={step !== "info"}>
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

                        {finished ? (
                            <p className="event-modal-finished">Este evento ya terminó.</p>
                        ) : (
                            <button type="button" className="event-modal-cta" ref={ctaRef} onClick={() => setStep("form")}>
                                Inscribirme
                            </button>
                        )}
                    </div>

                    {/* Paso 2: formulario. Solo se oculta, así no se borra lo escrito al regresar */}
                    {!finished && (
                        <div className="event-modal-register" ref={registerRef} hidden={step !== "form"}>
                            <button type="button" className="event-modal-back" onClick={() => setStep("info")}>
                                <ArrowLeft size={16} /> Volver al evento
                            </button>
                            <EventRegistrationForm eventId={event.id} onDirtyChange={handleDirtyChange} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}