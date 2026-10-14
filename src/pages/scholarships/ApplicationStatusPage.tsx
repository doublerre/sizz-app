import { useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { scholarshipService as api } from "../../services/scholarship.service";
import { useApiResource } from "../../hooks/useApiResource";
import { applicationTypes, dateLabel } from "../../data/scholarships";
import {
  LoadState,
  Notice,
  StatusBadge,
} from "../../components/scholarships/ScholarshipUI";
import DocumentFields from "../../components/scholarships/DocumentFields";

export function MyApplicationsPage() {
  const resource = useApiResource(api.applications);
  return (
    <main className="sch-public-content">
      <div className="sch-title">
        <p>Mi cuenta / Postulaciones</p>
        <h1>Mis postulaciones</h1>
      </div>
      <div className="sch-actions">
        <Link className="sch-button sch-button-secondary" to="/becas">
          Ver convocatorias
        </Link>
        <Link
          className="sch-button sch-button-primary"
          to="/cuenta/becas/horas"
        >
          Mis horas y becas
        </Link>
      </div>
      <LoadState {...resource} retry={resource.reload} />
      <div className="sch-grid">
        {resource.data?.map((application) => (
          <article key={application.id} className="sch-card sch-call-card">
            <StatusBadge status={application.status} />
            <h2>{application.periodName}</h2>
            <strong>{applicationTypes[application.applicationType]}</strong>
            <p>Creada el {dateLabel(application.createdAt)}</p>
            <Link
              className="sch-button sch-button-primary"
              to={`/cuenta/becas/${application.id}`}
            >
              Ver postulación
            </Link>
          </article>
        ))}
      </div>
      {resource.data?.length === 0 && (
        <Notice>
          Todavía no has iniciado una postulación.{" "}
          <Link to="/becas">Consultar convocatorias</Link>
        </Notice>
      )}
    </main>
  );
}

export default function ApplicationStatusPage() {
  const { applicationId = "" } = useParams();
  const resource = useApiResource(
    useCallback(() => api.application(applicationId), [applicationId]),
  );
  const application = resource.data;
  const reviewed =
    application && ["VALIDATED", "AWARDED"].includes(application.status);
  return (
    <main className="sch-public-content">
      <div className="sch-title">
        <p>
          <Link to="/cuenta/becas">Mi cuenta / Postulaciones</Link>
        </p>
        <h1>Estado de tu postulación</h1>
      </div>
      <LoadState {...resource} retry={resource.reload} />
      {application && (
        <div className="sch-two-columns">
          <section className="sch-card">
            <StatusBadge status={application.status} />
            <h2>{application.periodName}</h2>
            <strong>{applicationTypes[application.applicationType]}</strong>
            <div className="sch-divider" />
            <ol className="sch-timeline">
              <li className={application.submittedAt ? "complete" : "current"}>
                <strong>
                  {application.submittedAt
                    ? "Postulación enviada"
                    : "Postulación en borrador"}
                </strong>
                <small>
                  {dateLabel(application.submittedAt ?? application.createdAt)}
                </small>
              </li>
              <li
                className={
                  reviewed
                    ? "complete"
                    : application.submittedAt
                      ? "current"
                      : ""
                }
              >
                <strong>Revisión documental</strong>
                <small>
                  {reviewed
                    ? "Documentos validados. Ya puedes consultar tus evaluaciones."
                    : application.status === "DOCUMENTS_INCOMPLETE"
                      ? "Revisa las observaciones y reemplaza tus archivos."
                      : "El equipo validará los documentos de tu solicitud."}
                </small>
              </li>
              <li
                className={application.status === "AWARDED" ? "complete" : ""}
              >
                <strong>Resultado</strong>
                <small>
                  {application.status === "AWARDED"
                    ? "Tu beca fue otorgada."
                    : application.status === "REJECTED"
                      ? "Tu solicitud fue rechazada."
                      : "La selección depende de evaluación y presupuesto."}
                </small>
              </li>
            </ol>
            <div className="sch-actions">
              <Link
                className="sch-button sch-button-secondary"
                to={`/cuenta/becas/${application.id}/editar`}
              >
                {application.status === "DRAFT"
                  ? "Continuar postulación"
                  : "Ver datos y documentos"}
              </Link>
              {application.status === "VALIDATED" && (
                <Link
                  className="sch-button sch-button-primary"
                  to={`/cuenta/becas/${application.id}/examenes`}
                >
                  Contestar evaluaciones
                </Link>
              )}
              {application.status === "AWARDED" && (
                <Link
                  className="sch-button sch-button-primary"
                  to="/cuenta/becas/horas"
                >
                  Ver mi beca y horas
                </Link>
              )}
            </div>
          </section>
          <aside className="sch-card">
            <h2>Resumen</h2>
            <dl className="sch-metadata">
              <dt>Identificador</dt>
              <dd>{application.id}</dd>
              <dt>Documentos</dt>
              <dd>
                {
                  application.files.filter((file) => file.status === "APPROVED")
                    .length
                }{" "}
                aprobados de {application.files.length}
              </dd>
              <dt>Enviada</dt>
              <dd>{dateLabel(application.submittedAt)}</dd>
            </dl>
            <Notice>
              Las observaciones aparecen en cada documento. Puedes corregir
              archivos antes del cierre.
            </Notice>
            <DocumentFields
              application={application}
              onUpdate={resource.reload}
            />
          </aside>
        </div>
      )}
    </main>
  );
}
