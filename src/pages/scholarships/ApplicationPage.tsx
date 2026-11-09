import { useToast } from "../../context/useToast";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { scholarshipService as api } from "../../services/scholarship.service";
import type {
  Answers,
  ScholarshipApplication,
} from "../../services/scholarship.types";
import { apiMessage, useApiResource } from "../../hooks/useApiResource";
import { applicationTypes } from "../../data/scholarships";
import DynamicFields from "../../components/scholarships/DynamicFields";
import DocumentFields from "../../components/scholarships/DocumentFields";
import {
  answeredValues,
  displayAnswer,
  validateAnswers,
} from "../../components/scholarships/dynamicForm";
import {
  LoadState,
  Notice,
  ScholarshipButton,
} from "../../components/scholarships/ScholarshipUI";

function ApplicationEditor({ initial }: { initial: ScholarshipApplication }) {
  const [application, setApplication] = useState(initial);
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  const [step, setStep] = useState(0);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState("");
  const navigate = useNavigate();
  const editable = !["AWARDED", "REJECTED"].includes(application.status);
  async function save(advance = false) {
    const validation = validateAnswers(
      application.form.fields,
      answers,
      advance,
    );
    setErrors(validation);
    if (Object.keys(validation).length) return;
    setBusy(true);
    try {
      setApplication(
        await api.saveAnswers(application.id, answeredValues(answers)),
      );
      setSaved("Cambios guardados");
      toast.success("Cambios guardados.");
      if (advance) setStep(1);
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    const validation = validateAnswers(application.form.fields, answers, true);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setStep(0);
      return;
    }
    if (
      application.form.fields.some(
        (field) =>
          field.type === "FILE" &&
          field.required &&
          !application.files.some((file) => file.fieldKey === field.key),
      )
    ) {
      toast.error("Carga todos los documentos obligatorios.");
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      await api.saveAnswers(application.id, answeredValues(answers));
      await api.submit(application.id);
      toast.success("Postulación enviada.");
      navigate(`/cuenta/becas/${application.id}`);
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="sch-title">
        <p>
          <Link to="/cuenta/becas">Mis postulaciones</Link> /{" "}
          {application.periodName}
        </p>
        <h1>Completa tu postulación</h1>
        <p>
          {applicationTypes[application.applicationType]} · Los campos y
          documentos corresponden a la versión de tu solicitud.
        </p>
      </div>
      <div className="sch-step-layout">
        <aside className="sch-card sch-steps">
          <h2>Progreso</h2>
          {["Datos y preguntas", "Documentos", "Revisión"].map(
            (label, index) => (
              <button
                key={label}
                className={step === index ? "active" : ""}
                onClick={() => setStep(index)}
              >
                {index + 1} {label}
              </button>
            ),
          )}
          <div className="sch-divider" />
          <small>{saved || "Guarda tus cambios antes de salir."}</small>
        </aside>
        <section className="sch-card">
          {step === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save(true);
              }}
            >
              <h2>Datos y preguntas de la modalidad</h2>
              <DynamicFields
                fields={application.form.fields}
                answers={answers}
                disabled={busy || !editable}
                errors={errors}
                onChange={(key, value) => {
                  setAnswers({ ...answers, [key]: value });
                  setSaved("Cambios sin guardar");
                }}
              />
              <div className="sch-actions">
                <ScholarshipButton
                  tone="secondary"
                  disabled={busy || !editable}
                  onClick={() => save()}
                >
                  Guardar borrador
                </ScholarshipButton>
                <ScholarshipButton type="submit" disabled={busy || !editable}>
                  Continuar
                </ScholarshipButton>
              </div>
            </form>
          )}
          {step === 1 && (
            <>
              <h2>Documentos requeridos</h2>
              <DocumentFields
                application={application}
                editable={editable}
                onUpdate={() => {
                  void api
                    .application(application.id)
                    .then(setApplication)
                    .catch((error) => toast.error(apiMessage(error)));
                }}
              />
              <div className="sch-actions">
                <ScholarshipButton onClick={() => setStep(2)}>
                  Revisar postulación
                </ScholarshipButton>
              </div>
            </>
          )}
          {step === 2 && (
            <>
              <h2>Revisa tu postulación</h2>
              <dl>
                {application.form.fields
                  .filter((field) => field.type !== "FILE")
                  .map((field) => (
                    <div key={field.key} className="sch-review-answer">
                      <dt>{field.label}</dt>
                      <dd>{displayAnswer(answers[field.key], field)}</dd>
                    </div>
                  ))}
              </dl>
              <Notice>
                Revisa tus respuestas y completa los documentos obligatorios
                antes de enviar la postulación.
              </Notice>
              <div className="sch-actions">
                <ScholarshipButton tone="secondary" onClick={() => setStep(0)}>
                  Volver a datos
                </ScholarshipButton>
                <ScholarshipButton
                  disabled={busy || !editable}
                  onClick={submit}
                >
                  {busy ? "Enviando…" : "Enviar postulación"}
                </ScholarshipButton>
              </div>
            </>
          )}
        </section>
      </div>
      <Notice>
        Puedes corregir los documentos hasta el cierre de la convocatoria.
        Después del cierre no se permiten cambios.
      </Notice>
    </>
  );
}
export default function ApplicationPage() {
  const { applicationId = "" } = useParams();
  const resource = useApiResource(
    useCallback(() => api.application(applicationId), [applicationId]),
  );
  return (
    <main className="sch-public-content">
      <LoadState {...resource} retry={resource.reload} />
      {resource.data && (
        <ApplicationEditor key={resource.data.id} initial={resource.data} />
      )}
    </main>
  );
}
