import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { useAuth } from "@/context/useAuth";
import "./PublicReservationsPage.css";

const steps = [
  {
    number: 1,
    title: "Inicia sesión",
    desc1: "Tu cuenta conserva el historial y el estatus.",
    desc2: "Sin folios impresos ni llamadas.",
    color: "#0868b7",
  },
  {
    number: 2,
    title: "Envía la solicitud",
    desc1: "Completa los datos del grupo y la fecha tentativa.",
    desc2: "",
    color: "#55b82c",
  },
  {
    number: 3,
    title: "Consulta el estado",
    desc1: "Revisa el avance y las actualizaciones desde tu cuenta.",
    desc2: "",
    color: "#fbc400",
  },
  {
    number: 4,
    title: "Recibe la confirmación",
    desc1: "La solicitud puede confirmarse o cancelarse según disponibilidad.",
    desc2: "",
    color: "#ef4050",
  },
];

const checklistItems = [
  "Nombre y datos de contacto",
  "Actividad y horario disponible",
  "Tipo de solicitante y cantidad de visitantes",
  "Desglose opcional por tipo de visitante",
  "Respuestas al formulario vigente y aviso de privacidad",
];

export default function PublicReservationsPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="reservations-page">
      {/* Hero Banner */}
      <section className="reservations-hero">
        <div className="reservations-hero-decoration">
          <div className="reservations-hero-circle reservations-hero-circle--teal" />
          <div className="reservations-hero-circle reservations-hero-circle--yellow" />
        </div>
        <div className="reservations-hero-content">
          <p className="reservations-hero-eyebrow">RESERVACIONES PARA GRUPOS</p>
          <h1 className="reservations-hero-title">Organiza tu visita y consulta su avance</h1>
          <p className="reservations-hero-subtitle">
            Crea una cuenta para enviar la solicitud, recibir el dictamen y consultar su estatus.
          </p>
          <div className="reservations-hero-actions">
            {isAuthenticated ? (
              <>
                <Link to="/cuenta/nueva-reservacion" className="reservations-hero-btn reservations-hero-btn--primary">
                  Hacer una reservación
                </Link>
                <Link to="/cuenta/reservaciones" className="reservations-hero-btn reservations-hero-btn--secondary">
                  Ver mis reservaciones
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="reservations-hero-btn reservations-hero-btn--primary">
                  Iniciar sesión para reservar
                </Link>
                <Link to="/register" className="reservations-hero-btn reservations-hero-btn--secondary">
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works - Steps */}
      <section className="reservations-how">
        <div className="container">
          <h2 className="reservations-section-title">¿Cómo funciona?</h2>
          <div className="reservations-steps-grid">
            {steps.map((step) => (
              <div className="reservations-step-card" key={step.number}>
                <div className="reservations-step-header">
                  <div
                    className="reservations-step-number-circle"
                    style={{ backgroundColor: step.color }}
                  >
                    {step.number}
                  </div>
                  <h3 className="reservations-step-title">{step.title}</h3>
                </div>
                <p className="reservations-step-desc">{step.desc1}</p>
                {step.desc2 && <p className="reservations-step-desc">{step.desc2}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schedules + Checklist */}
      <section className="reservations-details">
        <div className="container">
          {/* Left - Schedules */}
          <div className="reservations-schedules">
            <h3 className="reservations-schedules-title">Horarios disponibles para grupos</h3>
            <p className="reservations-schedules-subtitle">
              Los horarios se consultan al seleccionar actividad y fecha dentro de una cuenta autenticada.
            </p>
            <div className="reservations-schedules-grid">
              <div className="reservations-schedule-card reservations-schedule-card--weekday">
                <span className="reservations-schedule-label">DISPONIBILIDAD</span>
                <span className="reservations-schedule-time">Por actividad y fecha</span>
              </div>
              <div className="reservations-schedule-card reservations-schedule-card--weekend">
                <span className="reservations-schedule-label">CUPO</span>
                <span className="reservations-schedule-time">Sujeto a disponibilidad</span>
              </div>
            </div>
            <p className="reservations-schedules-note">
              La API vuelve a validar el aforo al enviar cada solicitud.
            </p>
          </div>

          {/* Right - Checklist */}
          <div className="reservations-checklist">
            <h3 className="reservations-checklist-title">Antes de comenzar</h3>
            <ul className="reservations-checklist-list">
              {checklistItems.map((item) => (
                <li className="reservations-checklist-item" key={item}>
                  <Check size={12} color="#fff" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {isAuthenticated ? (
              <Link to="/cuenta/nueva-reservacion" className="reservations-checklist-btn">
                Reservar ahora
              </Link>
            ) : (
              <Link to="/login" className="reservations-checklist-btn">
                Acceder a mi cuenta
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}
