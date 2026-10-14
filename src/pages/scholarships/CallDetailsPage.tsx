import { useToast } from "../../context/useToast";
import { useAuth } from "../../context/useAuth";
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
  const { isAuthenticated } = useAuth();
  const resource = useApiResource(
    useCallback(async () => {
      const [calls, eligible, applications] = await Promise.all([
        api.publicCalls(),
        isAuthenticated ? api.openCalls() : Promise.resolve([]),
        isAuthenticated ? api.applications() : Promise.resolve([]),
      ]);
      return {
        call: calls.find((call) => call.id === callId),
        eligible: eligible.find((call) => call.id === callId),
        applications,
      };
    }, [callId, isAuthenticated]),
  );
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const call = resource.data?.call;
  const existing = resource.data?.applications.find(
    (application) => application.periodId === call?.periodId,
  );
  const form = resource.data?.eligible?.form ?? existing?.form;
  const personalType =
    resource.data?.eligible?.applicationType ?? existing?.applicationType;
  async function start() {
    if (!isAuthenticated) {
      navigate("/login", { state: { returnTo: `/becas/${callId}` } });
      return;
    }
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
              <h3>Modalidades de la convocatoria</h3>
              <p>
                {call.applicationTypes
                  .toSorted()
                  .map((type) => applicationTypes[type])
                  .join(" · ")}
              </p>
              <h3>Tu modalidad de postulación</h3>
              <div className="sch-option">
                {personalType && (
                  <strong>{applicationTypes[personalType]}</strong>
                )}
                <p className="sch-muted">
                  {isAuthenticated
                    ? personalType
                      ? "La modalidad se determina con tu historial de becas del semestre anterior."
                      : "Esta convocatoria no tiene una modalidad disponible para tu historial."
                    : "Al iniciar sesión se determina la modalidad y el formulario que te corresponden según tu historial."}
                </p>
              </div>
              <h3>Requisitos de la solicitud</h3>
              {!form && (
                <p className="sch-muted">
                  Los requisitos específicos dependen de tu modalidad de
                  postulación.
                </p>
              )}
              <ul className="sch-muted">
                {form?.fields
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
              {!form && (
                <p className="sch-muted">
                  Al postularte podrás consultar la documentación que
                  corresponde a tu modalidad.
                </p>
              )}
              <ul className="sch-muted">
                {form?.fields
                  .filter((field) => field.type === "FILE")
                  .map((field) => (
                    <li key={field.key}>{field.label}</li>
                  ))}
              </ul>
              {isAuthenticated ? (
                <ScholarshipButton
                  disabled={busy || (!existing && !resource.data?.eligible)}
                  onClick={start}
                >
                  {busy
                    ? "Iniciando…"
                    : existing
                      ? "Ver mi postulación"
                      : "Iniciar postulación"}
                </ScholarshipButton>
              ) : (
                <Link
                  className="sch-button sch-button-primary"
                  to="/login"
                  state={{ returnTo: `/becas/${callId}` }}
                >
                  Iniciar sesión para postularme
                </Link>
              )}
              <p className="sch-muted">
                {isAuthenticated
                  ? "Guardada en tu cuenta"
                  : "Puedes consultar la convocatoria sin iniciar sesión."}
              </p>
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
