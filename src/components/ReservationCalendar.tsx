import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import "./ReservationCalendar.css";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const toKey = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const formatDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

type CalendarVariant = "reservations" | "sales";

interface Props {
    value: string | null;
    markedDates: Set<string>;
    onChange: (value: string | null) => void;
    variant: CalendarVariant;
    markedLabel?: string;
}

export default function ReservationCalendar({ value, markedDates, onChange, variant, markedLabel }: Props) {
    const [open, setOpen] = useState(false);
    const initial = value ? new Date(value + "T00:00:00") : new Date();
    const [view, setView] = useState({ year: initial.getFullYear(), month: initial.getMonth() });
    const ref = useRef<HTMLDivElement>(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const offset = (new Date(view.year, view.month, 1).getDay() + 6) % 7; // semana inicia en lunes
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array(offset).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const moveMonth = (delta: number) => {
        const d = new Date(view.year, view.month + delta, 1);
        setView({ year: d.getFullYear(), month: d.getMonth() });
    };

    const now = new Date();
    const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

    const legendLabel = markedLabel ?? (variant === "reservations" ? "Día con reservación" : "Día con venta");

    return (
        <div className={`calendar-filter calendar-filter--${variant}`} ref={ref}>
            <button type="button" className="calendar-trigger" aria-label="Filtrar por fecha" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                {value ? formatDate(value) : "Todas las fechas"}
                <CalendarDays size={16} aria-hidden="true" />
            </button>

            {open && (
                <div className="calendar-popover" role="dialog" aria-label="Calendario">
                    <div className="calendar-head">
                        <button type="button" aria-label="Mes anterior" onClick={() => moveMonth(-1)}>‹</button>
                        <strong>{MONTHS[view.month]} {view.year}</strong>
                        <button type="button" aria-label="Mes siguiente" onClick={() => moveMonth(1)}>›</button>
                    </div>

                    <div className="calendar-grid">
                        {WEEKDAYS.map((w, i) => <span key={i} className="calendar-weekday">{w}</span>)}
                        {cells.map((day, i) => {
                            if (day === null) return <span key={`e${i}`} />;
                            const key = toKey(view.year, view.month, day);
                            const classes = [
                                "calendar-day",
                                markedDates.has(key) ? "has-event" : "",
                                key === value ? "selected" : "",
                                key === todayKey ? "today" : "",
                            ].join(" ");
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    className={classes}
                                    onClick={() => { onChange(key === value ? null : key); setOpen(false); }}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    <div className="calendar-foot">
                        <span className="calendar-legend"><i /> {legendLabel}</span>
                        <button type="button" onClick={() => { onChange(null); setOpen(false); }}>Quitar fecha</button>
                    </div>
                </div>
            )}
        </div>
    );
}