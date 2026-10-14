import { useToast } from "../../context/useToast";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { scholarshipService as api } from "../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../hooks/useApiResource";
import { applicationTypes, dateLabel } from "../../data/scholarships";
import {
  LoadState,
  Notice,
  ScholarshipButton,
  StatusBadge,
} from "../../components/scholarships/ScholarshipUI";

export default function CallDetailsPage() {
  const { callId = "" } = useParams();
  const navigate = useNavigate();
  const resource = useApiResource(
    useCallback(async () => {
      const [calls, applications] = await Promise.all([
        api.openCalls(),
        api.applications(),
      ]);
      return { call: calls.find((call) => call.id === callId), applications };
    }, [callId]),
  );
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const call = resource.data?.call;
  const existing = resource.data?.applications.find(
    (application) => application.periodId === call?.periodId,
  );
  async function start() {
    if (existing) {
      navigate(`/cuenta/becas/${existing.id}`);
      return;
    }
    setBusy(true);
    try {
      const application = await api.createApplication(callId);
      toast.success("Postulación creada.");
      navigate(`/cuenta/becas/${application.id}/editar`);
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="sch-public-content">
      <LoadState {...resource} retry={resource.reload} />
      {call ? (
        <>
          <div className="sch-title">
            <p>
              <Link to="/becas">Convocatorias</Link> / {call.name}
            </p>
            <div className="sch-section-heading">
              <h1>{call.name}</h1>
              <StatusBadge status="OPEN" />
            </div>
          </div>
          <div className="sch-two-columns">
            <section className="sch-card">
              <h2>Acerca de la convocatoria</h2>
              <p>
                {call.periodName} · Beca de {call.durationMonths} meses.
              </p>
              <h3>Tu modalidad</h3>
              <div className="sch-option">
                <strong>{applicationTypes[call.applicationType]}</strong>
                <p className="sch-muted">
                  La modalidad se determina con tu historial de becas del
                  semestre anterior.
                </p>
              </div>
              <h3>Requisitos de la solicitud</h3>
              <ul className="sch-muted">
                {call.form.fields
                  .filter((field) => field.required)
                  .map((field) => (
                    <li key={field.key}>{field.label}</li>
                  ))}
              </ul>
              <Notice>
                Solo puedes presentar una solicitud por periodo semestral.
                Guarda tus respuestas y entrega la documentación antes del
                cierre.
              </Notice>
            </section>
            <aside className="sch-card">
              <h2>Fechas importantes</h2>
              <dl className="sch-metadata">
                <dt>Apertura</dt>
                <dd>{dateLabel(call.opensOn)}</dd>
                <dt>Cierre de registro</dt>
                <dd>{dateLabel(call.closesOn)}</dd>
                <dt>Periodo</dt>
                <dd>{call.periodName}</dd>
              </dl>
              <div className="sch-divider" />
              <h3>Documentación</h3>
              <ul className="sch-muted">
                {call.form.fields
                  .filter((field) => field.type === "FILE")
                  .map((field) => (
                    <li key={field.key}>{field.label}</li>
                  ))}
              </ul>
              <ScholarshipButton disabled={busy} onClick={start}>
                {busy
                  ? "Iniciando…"
                  : existing
                    ? "Ver mi postulación"
                    : "Iniciar postulación"}
              </ScholarshipButton>
              <p className="sch-muted">Guardada en tu cuenta</p>
            </aside>
          </div>
        </>
      ) : (
        resource.data && (
          <Notice>
            Esta convocatoria ya no está disponible.{" "}
            <Link to="/cuenta/becas">Consulta tus postulaciones.</Link>
          </Notice>
        )
      )}
    </main>
  );
}
