import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { reservationStatusLabels, dateLabel } from "./reservations.data";
import "./reservations.css";

/* ─── Tipos ─── */

interface FormAnswer {
  fieldLabel: string;
  value: string;
}

interface ReservationDetail {
  id: string;
  folio: string;
  applicantName: string;
  institution: string;
  email: string;
  phone: string;
  visitDate: string;
  visitTime: string;
  groupSize: number;
  experienceName: string;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED";
  responsibleName: string;
  createdAt: string;
  answers: FormAnswer[];
  notes: string;
  discount?: string;
}

/* ─── Mock data ─── */

const mockDetail: ReservationDetail = {
  id: "1",
  folio: "R-2026-0187",
  applicantName: "María Hernández",
  institution: "Primaria Ciencia Viva",
  email: "maria.hernandez@cienciaviva.edu.mx",
  phone: "477 123 4567",
  visitDate: "2026-09-18",
  visitTime: "10:00",
  groupSize: 36,
  experienceName: "Taller de Física Interactiva",
  status: "PENDING",
  responsibleName: "Carlos Mendoza",
  createdAt: "2026-08-10T10:30:00",
  notes: "Solicita descuento por documento oficial COZCYT/DG/184/2026 (20%).",
  discount: "20%",
  answers: [
    { fieldLabel: "Nombre del solicitante", value: "María Hernández" },
    { fieldLabel: "Correo electrónico", value: "maria.hernandez@cienciaviva.edu.mx" },
    { fieldLabel: "Teléfono", value: "477 123 4567" },
    { fieldLabel: "Institución educativa", value: "Primaria Ciencia Viva" },
    { fieldLabel: "Fecha y horario preferido", value: "18 de septiembre de 2026, 10:00 hrs" },
    { fieldLabel: "Tamaño del grupo", value: "36 personas (30 alumnos + 6 docentes)" },
    { fieldLabel: "Experiencia de interés", value: "Taller de Física Interactiva" },
    { fieldLabel: "¿Cuentan con transporte propio?", value: "Sí, dos autobuses escolares" },
    { fieldLabel: "Restricciones alimentarias", value: "2 alumnos con alergia al maní" },
    { fieldLabel: "Documento oficial para descuento", value: "COZCYT/DG/184/2026 — 20% de descuento autorizado" },
    { fieldLabel: "Observaciones adicionales", value: "Solicitan que se prepare el laboratorio de óptica con anticipación." },
  ],
};

const mockDetails: Record<string, ReservationDetail> = {
  "1": mockDetail,
  "2": {
    ...mockDetail,
    id: "2",
    folio: "R-2026-0186",
    applicantName: "Juan Pérez",
    institution: "Secundaria Horizonte",
    email: "juan.perez@horizonte.edu.mx",
    phone: "477 234 5678",
    visitDate: "2026-09-19",
    visitTime: "10:00",
    groupSize: 46,
    experienceName: "Domo Planetario",
    status: "IN_REVIEW",
    responsibleName: "Laura R.",
    notes: "",
    discount: undefined,
    answers: [
      { fieldLabel: "Nombre del solicitante", value: "Juan Pérez" },
      { fieldLabel: "Correo electrónico", value: "juan.perez@horizonte.edu.mx" },
      { fieldLabel: "Institución educativa", value: "Secundaria Horizonte" },
      { fieldLabel: "Fecha y horario preferido", value: "19 de septiembre de 2026, 10:00 hrs" },
      { fieldLabel: "Tamaño del grupo", value: "46 personas (40 alumnos + 6 docentes)" },
      { fieldLabel: "Experiencia de interés", value: "Domo Planetario" },
    ],
  },
  "3": {
    ...mockDetail,
    id: "3",
    folio: "R-2026-0185",
    applicantName: "Laura García",
    institution: "Colegio Arcoíris",
    status: "APPROVED",
    visitDate: "2026-09-20",
    groupSize: 22,
    responsibleName: "Carlos M.",
  },
  "4": {
    ...mockDetail,
    id: "4",
    folio: "R-2026-0184",
    applicantName: "Pedro Ramírez",
    institution: "Jardín Estrellita",
    status: "REJECTED",
    visitDate: "2026-09-23",
    groupSize: 31,
    responsibleName: "",
  },
};

function StatusBadge({ status }: { status: string }) {
  const classNameMap: Record<string, string> = {
    PENDING: "res-status--pending",
    IN_REVIEW: "res-status--in-review",
    APPROVED: "res-status--approved",
    REJECTED: "res-status--rejected",
  };
  const className = classNameMap[status] || "";
  return <span className={`res-status ${className}`}>{reservationStatusLabels[status] ?? status}</span>;
}

/* ─── Página principal ─── */

export default function AdminReservationDetail() {
  const { id } = useParams();
  const detail = mockDetails[id ?? ""] ?? mockDetail;
  const [comment, setComment] = useState("");

  const handleApprove = () => {
    alert(`Reservación ${detail.folio} aprobada.\nComentario: ${comment || "(sin comentario)"}`);
  };

  const handleReject = () => {
    alert(`Reservación ${detail.folio} rechazada.\nComentario: ${comment || "(sin comentario)"}`);
  };

  return (
    <div className="res-page">
      <header className="res-head">
        <div className="res-head__text">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <Link to="/app/reservaciones" className="res-folio-link" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
              <ArrowLeft size={16} />
            </Link>
            <span className="res-head__title" style={{ marginBottom: 0, fontSize: "1.4rem" }}>
              {detail.folio}
            </span>
          </div>
          <p className="res-head__subtitle">
            {detail.applicantName} · {detail.institution}
          </p>
        </div>
        <div className="res-head__actions">
          <StatusBadge status={detail.status} />
        </div>
      </header>

      <div className="res-content">
        <div className="res-detail-grid">
          {/* Columna principal */}
          <div>
            {/* Info del solicitante */}
            <div className="res-card">
              <div className="res-detail-header">
                <h2>Información del solicitante</h2>
              </div>
              <div className="res-detail-meta">
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Solicitante</span>
                  <span className="res-detail-meta__value">{detail.applicantName}</span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Institución</span>
                  <span className="res-detail-meta__value">{detail.institution}</span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Correo electrónico</span>
                  <span className="res-detail-meta__value">{detail.email}</span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Teléfono</span>
                  <span className="res-detail-meta__value">{detail.phone}</span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Fecha de visita</span>
                  <span className="res-detail-meta__value">
                    {dateLabel(detail.visitDate)} · {detail.visitTime}
                  </span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Tamaño del grupo</span>
                  <span className="res-detail-meta__value">{detail.groupSize} personas</span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Experiencia</span>
                  <span className="res-detail-meta__value">{detail.experienceName}</span>
                </div>
                <div className="res-detail-meta__item">
                  <span className="res-detail-meta__label">Responsable</span>
                  <span className="res-detail-meta__value">
                    {detail.responsibleName || "Sin asignar"}
                  </span>
                </div>
                {detail.discount && (
                  <div className="res-detail-meta__item">
                    <span className="res-detail-meta__label">Descuento</span>
                    <span className="res-detail-meta__value">{detail.discount}</span>
                  </div>
                )}
              </div>
              {detail.notes && (
                <>
                  <hr className="res-divider" />
                  <div className="res-detail-meta__item">
                    <span className="res-detail-meta__label">Notas</span>
                    <span className="res-detail-meta__value">{detail.notes}</span>
                  </div>
                </>
              )}
            </div>

            {/* Respuestas del formulario */}
            <div className="res-card" style={{ marginTop: "1.25rem" }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#10243a", margin: "0 0 1.25rem" }}>
                Respuestas del formulario
              </h2>
              <div className="res-answers-list">
                {detail.answers.map((answer, idx) => (
                  <div className="res-answer" key={idx}>
                    <span className="res-answer__label">{answer.fieldLabel}</span>
                    <div className="res-answer__value">{answer.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel de dictamen */}
          <aside className="res-card res-verdict">
            <h3 className="res-verdict__title">Dictamen</h3>

            <div className="res-verdict__field">
              <label>Comentario</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Escribe un comentario para el solicitante..."
              />
            </div>

            <div className="res-verdict__actions">
              <button className="res-btn-primary res-btn-success" onClick={handleApprove}>
                Aprobar reservación
              </button>
              <button className="res-btn-danger" onClick={handleReject}>
                Rechazar reservación
              </button>
              <Link
                to="/app/reservaciones"
                className="res-btn-secondary"
                style={{ textAlign: "center" }}
              >
                Volver al listado
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
