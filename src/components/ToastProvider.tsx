import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "../context/useToast";
import type { ToastType } from "../context/useToast";
import successIcon from "../assets/toasts/success-icon.svg";
import errorIcon from "../assets/toasts/error-icon.svg";
import infoIcon from "../assets/toasts/info-icon.svg";
import "./Toast.css";

const variants = {
  success: { title: "Cambios guardados", icon: successIcon, glyph: "✓" },
  error: { title: "No se pudo guardar", icon: errorIcon, glyph: "!" },
  info: { title: "Información actualizada", icon: infoIcon, glyph: "i" },
};

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<{
    id: string;
    type: ToastType;
    message: string;
  } | null>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!current || current.type === "error" || paused) return;
    const timer = window.setTimeout(() => setCurrent(null), 6000);
    return () => window.clearTimeout(timer);
  }, [current, paused]);
  const toast = useMemo(() => {
    function show(type: ToastType, message: string) {
      if (!message) return;
      setPaused(false);
      setCurrent({ id: crypto.randomUUID(), type, message });
    }
    return {
      success: (message: string) => show("success", message),
      error: (message: string) => show("error", message),
      info: (message: string) => show("info", message),
    };
  }, []);
  const variant = current ? variants[current.type] : null;
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" role="region" aria-label="Notificaciones">
        {current && variant && (
          <div
            key={current.id}
            className={`toast-card toast-${current.type}`}
            role={current.type === "error" ? "alert" : "status"}
            aria-atomic="true"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={(event) =>
              setPaused(event.currentTarget.contains(document.activeElement))
            }
            onFocus={() => setPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setPaused(event.currentTarget.matches(":hover"));
            }}
          >
            <span className="toast-icon" aria-hidden="true">
              <img src={variant.icon} alt="" />
              <span>{variant.glyph}</span>
            </span>
            <div className="toast-content">
              <strong>{variant.title}</strong>
              <p>{current.message}</p>
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar notificación"
              onClick={() => setCurrent(null)}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}
