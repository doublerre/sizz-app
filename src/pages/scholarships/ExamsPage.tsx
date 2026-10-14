import { useToast } from "../../context/useToast";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Answers, Exam } from "../../services/scholarship.types";
import { scholarshipService as api } from "../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../hooks/useApiResource";
import DynamicFields from "../../components/scholarships/DynamicFields";
import {
  answeredValues,
  validateAnswers,
} from "../../components/scholarships/dynamicForm";
import {
  LoadState,
  Notice,
  ScholarshipButton,
} from "../../components/scholarships/ScholarshipUI";
import { dateLabel } from "../../data/scholarships";

function ExamForm({
  exam,
  applicationId,
  onSubmit,
}: {
  exam: Exam;
  applicationId: string;
  onSubmit: () => void;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  async function submit() {
    const validation = validateAnswers(exam.form.fields, answers, true);
    setErrors(validation);
    if (Object.keys(validation).length) {
      setConfirm(false);
      return;
    }
    if (!confirm) {
      setConfirm(true);
      return;
    }
    setBusy(true);
    try {
      await api.submitExam(
        applicationId,
        exam.formVersionId,
        answeredValues(answers),
      );
      toast.success("Evaluación enviada.");
      onSubmit();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="sch-card"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h2>{exam.name}</h2>
      {exam.submittedAt ? (
        <Notice>
          Evaluación entregada el {dateLabel(exam.submittedAt)}. Resultado:{" "}
          {exam.scorePercent}%.
        </Notice>
      ) : (
        <>
          <DynamicFields
            fields={exam.form.fields}
            answers={answers}
            errors={errors}
            disabled={busy}
            onChange={(key, value) => {
              setAnswers({ ...answers, [key]: value });
              setConfirm(false);
            }}
          />
          {confirm && (
            <Notice>
              Al confirmar se calificará el examen y ya no podrás cambiar tus
              respuestas.
            </Notice>
          )}
          <div className="sch-actions">
            {confirm && (
              <ScholarshipButton
                tone="secondary"
                onClick={() => setConfirm(false)}
              >
                Seguir revisando
              </ScholarshipButton>
            )}
            <ScholarshipButton type="submit" disabled={busy}>
              {busy
                ? "Entregando…"
                : confirm
                  ? "Confirmar entrega"
                  : "Entregar evaluación"}
            </ScholarshipButton>
          </div>
        </>
      )}
    </form>
  );
}
export default function ExamsPage() {
  const { applicationId = "" } = useParams();
  const resource = useApiResource(
    useCallback(() => api.exams(applicationId), [applicationId]),
  );
  return (
    <main className="sch-public-content">
      <div className="sch-title">
        <p>
          <Link to={`/cuenta/becas/${applicationId}`}>Mi postulación</Link> /
          Evaluaciones
        </p>
        <h1>Evaluaciones de la convocatoria</h1>
        <p>
          El examen aporta 70% y la asistencia a capacitaciones 30% del mérito.
        </p>
      </div>
      <LoadState {...resource} retry={resource.reload} />
      <div className="sch-form-builder">
        {resource.data?.map((exam) => (
          <ExamForm
            key={exam.formVersionId}
            exam={exam}
            applicationId={applicationId}
            onSubmit={resource.reload}
          />
        ))}
      </div>
      {resource.data?.length === 0 && (
        <Notice>No hay evaluaciones asignadas a esta convocatoria.</Notice>
      )}
    </main>
  );
}
