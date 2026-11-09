import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import "./ReservationCalendar.css";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const toKey = (y: number, m: number, d: number) =>
  `${String(y).padStart(4, "0")}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const calendarDate = (year: number, month: number, day: number) => {
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month, day);
  return date;
};

const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return calendarDate(y, m - 1, d).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

type CalendarVariant = "reservations" | "sales" | "date";

interface Props {
  value: string | null;
  markedDates: Set<string>;
  onChange: (value: string | null) => void;
  variant: CalendarVariant;
  markedLabel?: string;
  disabled?: boolean;
  min?: string;
  max?: string;
}

export default function ReservationCalendar({
  value,
  markedDates,
  onChange,
  variant,
  markedLabel,
  disabled,
  min,
  max,
}: Props) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value + "T00:00:00") : new Date();
  const [view, setView] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  const offset = (calendarDate(view.year, view.month, 1).getDay() + 6) % 7; // semana inicia en lunes
  const daysInMonth = calendarDate(view.year, view.month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const moveMonth = (delta: number) => {
    const d = calendarDate(view.year, view.month + delta, 1);
    if (d.getFullYear() < 1 || d.getFullYear() > 9999) return;
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const now = new Date();
  const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());

  const legendLabel =
    markedLabel ??
    (variant === "reservations" ? "Día con reservación" : "Día con venta");

  return (
    <div
      className={`calendar-filter calendar-filter--${variant}`}
      ref={ref}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        disabled={disabled}
        type="button"
        className="calendar-trigger"
        aria-label={
          variant === "date" ? "Abrir calendario" : "Filtrar por fecha"
        }
        aria-expanded={open}
        onClick={() => {
          const selected = value ? new Date(value + "T00:00:00") : new Date();
          setView({ year: selected.getFullYear(), month: selected.getMonth() });
          setOpen((o) => !o);
        }}
      >
        {variant !== "date" && (value ? formatDate(value) : "Todas las fechas")}
        <CalendarDays size={16} aria-hidden="true" />
      </button>

      {open && !disabled && (
        <div className="calendar-popover" role="dialog" aria-label="Calendario">
          <div className="calendar-head">
            <button
              type="button"
              aria-label="Mes anterior"
              onClick={() => moveMonth(-1)}
            >
              ‹
            </button>
            <select
              aria-label="Mes"
              value={view.month}
              onChange={(event) =>
                setView({ ...view, month: Number(event.target.value) })
              }
            >
              {MONTHS.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <input
              aria-label="Año"
              type="number"
              min={1}
              max={9999}
              value={view.year}
              onChange={(event) => {
                const year = event.target.valueAsNumber;
                if (Number.isInteger(year) && year >= 1 && year <= 9999)
                  setView({ ...view, year });
              }}
            />
            <button
              type="button"
              aria-label="Mes siguiente"
              onClick={() => moveMonth(1)}
            >
              ›
            </button>
          </div>

          <div className="calendar-grid">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="calendar-weekday">
                {w}
              </span>
            ))}
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
                  disabled={!!((min && key < min) || (max && key > max))}
                  data-date={key}
                  aria-label={formatDate(key)}
                  aria-pressed={key === value}
                  aria-current={key === todayKey ? "date" : undefined}
                  onKeyDown={(event) => {
                    const delta = (
                      {
                        ArrowLeft: -1,
                        ArrowRight: 1,
                        ArrowUp: -7,
                        ArrowDown: 7,
                      } as Record<string, number>
                    )[event.key];
                    if (delta === undefined) return;
                    event.preventDefault();
                    const next = calendarDate(
                      view.year,
                      view.month,
                      day + delta,
                    );
                    if (next.getFullYear() < 1 || next.getFullYear() > 9999)
                      return;
                    const nextKey = toKey(
                      next.getFullYear(),
                      next.getMonth(),
                      next.getDate(),
                    );
                    if ((min && nextKey < min) || (max && nextKey > max))
                      return;
                    setView({
                      year: next.getFullYear(),
                      month: next.getMonth(),
                    });
                    requestAnimationFrame(() =>
                      ref.current
                        ?.querySelector<HTMLButtonElement>(
                          `[data-date="${nextKey}"]`,
                        )
                        ?.focus(),
                    );
                  }}
                  onClick={() => {
                    onChange(
                      variant === "date" ? key : key === value ? null : key,
                    );
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="calendar-foot">
            {variant === "date" ? (
              <button
                type="button"
                disabled={
                  !!((min && todayKey < min) || (max && todayKey > max))
                }
                onClick={() => {
                  onChange(todayKey);
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                Hoy
              </button>
            ) : (
              <span className="calendar-legend">
                <i /> {legendLabel}
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              {variant === "date" ? "Limpiar" : "Quitar fecha"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
