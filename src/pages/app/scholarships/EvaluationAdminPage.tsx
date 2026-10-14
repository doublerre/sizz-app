import { useToast } from "../../../context/useToast";
import { useCallback, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  AdminApplication,
  TrainingSession,
} from "../../../services/scholarship.types";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../../hooks/useApiResource";
import { money } from "../../../data/scholarships";
import {
  AdminScholarshipNav,
  LoadState,
  Notice,
  ScholarshipButton,
  ScholarshipField,
  ScholarshipHeader,
} from "../../../components/scholarships/ScholarshipUI";

function SessionAttendance({
  session,
  applicants,
  onUpdate,
  editable,
}: {
  session: TrainingSession;
  applicants: AdminApplication[];
  onUpdate: () => void;
  editable: boolean;
}) {
  const resource = useApiResource(
    useCallback(() => api.attendance(session.id), [session.id]),
  );
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function mark(studentId: string, present: boolean) {
    setBusy(true);
    try {
      await api.markAttendance(session.id, studentId, present);
      resource.reload();
      toast.success("Asistencia actualizada.");
      onUpdate();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <details className="sch-builder-field">
      <summary>
        {session.name} · {session.weight}%
      </summary>
      <LoadState {...resource} retry={resource.reload} />
      {resource.data &&
        applicants.map((row) => (
          <label className="sch-checkbox" key={row.studentId}>
            <input
              type="checkbox"
              disabled={busy || !editable}
              checked={
                resource.data?.some(
                  (item) => item.studentId === row.studentId,
                ) ?? false
              }
              onChange={(e) => mark(row.studentId, e.target.checked)}
            />
            {row.firstName} {row.lastName}
          </label>
        ))}
    </details>
  );
}

export default function EvaluationAdminPage() {
  const { callId = "" } = useParams();
  const base = useApiResource(
    useCallback(async () => {
      const [calls, applicants, grants, forms, assignments] = await Promise.all(
        [
          api.calls(),
          api.adminApplications(callId),
          api.grants(callId),
          api.forms(),
          api.callForms(callId),
        ],
      );
      return {
        call: calls.find((call) => call.id === callId),
        applicants,
        grants,
        forms,
        assignments,
      };
    }, [callId]),
  );
  const sessions = useApiResource(
    useCallback(() => api.sessions(callId), [callId]),
  );
  const merit = useApiResource(useCallback(() => api.merit(callId), [callId]));
  const [formVersionId, setFormVersionId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(100);
  const [categories, setCategories] = useState<Record<string, string>>({});
  const [confirmStudent, setConfirmStudent] = useState("");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const call = base.data?.call;
  const canConfigure = !base.loading && base.data?.grants.length === 0;
  const canConfigureTraining =
    canConfigure &&
    !sessions.loading &&
    !!sessions.data &&
    sessions.data.every((session) => session.presentCount === 0);
  const trainingConfigured =
    !!sessions.data?.length &&
    Math.round(
      sessions.data.reduce((sum, session) => sum + session.weight, 0) * 1000,
    ) === 100000;
  async function assignExam() {
    setBusy(true);
    try {
      await api.assignForm(callId, formVersionId, null);
      setFormVersionId("");
      base.reload();
      merit.reload();
      toast.success(
        "Evaluación asignada. Solo alumnos con documentación validada pueden presentarla.",
      );
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function saveSession() {
    setBusy(true);
    try {
      await api.saveSession(callId, name, weight, sessionId || undefined);
      setName("");
      setWeight(100);
      setSessionId("");
      sessions.reload();
      merit.reload();
      toast.success("Sesión guardada.");
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function award(studentId: string) {
    const categoryId =
      categories[studentId] ??
      call?.categories.find((category) => category.active)?.id;
    if (!categoryId) {
      toast.error("Selecciona una categoría activa.");
      return;
    }
    if (confirmStudent !== studentId) {
      setConfirmStudent(studentId);
      return;
    }
    setBusy(true);
    try {
      await api.award(callId, studentId, categoryId);
      base.reload();
      merit.reload();
      setConfirmStudent("");
      toast.success("Beca otorgada y presupuesto reservado.");
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ScholarshipHeader
        title="Evaluación y otorgamiento"
        subtitle="Examen 70% · Capacitaciones 30% · Selección administrativa según presupuesto."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav callId={callId} />
        <LoadState {...base} retry={base.reload} />
        {call && (
          <>
            <div className="sch-summary-grid">
              <div className="sch-card">
                <small>Presupuesto total</small>
                <strong>{money(call.totalBudget)}</strong>
              </div>
              <div className="sch-card">
                <small>Disponible</small>
                <strong>{money(call.availableBudget)}</strong>
              </div>
              <div className="sch-card">
                <small>Becas otorgadas</small>
                <strong>{base.data?.grants.length}</strong>
              </div>
            </div>
            <section className="sch-card">
              <h2>Formularios de evaluación</h2>
              <Notice>
                Configura las evaluaciones después de revisar la documentación.
                Solo las postulaciones validadas pueden presentarlas; publicar
                la convocatoria no requiere exámenes.
              </Notice>
              {base.data?.assignments
                .filter((assignment) => assignment.purpose === "EXAM")
                .map((assignment) => (
                  <p key={assignment.id}>
                    {assignment.formName} · v{assignment.version}
                  </p>
                ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void assignExam();
                }}
              >
                <ScholarshipField label="Examen y versión">
                  <select
                    required
                    value={formVersionId}
                    disabled={busy || !canConfigure}
                    onChange={(e) => setFormVersionId(e.target.value)}
                  >
                    <option value="">Selecciona una evaluación</option>
                    {base.data?.forms
                      .filter((form) => form.active && form.purpose === "EXAM")
                      .flatMap((form) =>
                        form.versions
                          .filter(
                            (version) =>
                              !base.data?.assignments.some(
                                (assignment) =>
                                  assignment.formVersionId === version.id,
                              ),
                          )
                          .map((version) => (
                            <option key={version.id} value={version.id}>
                              {form.name} · v{version.version}
                            </option>
                          )),
                      )}
                  </select>
                </ScholarshipField>
                <div className="sch-actions">
                  <ScholarshipButton
                    type="submit"
                    disabled={busy || !canConfigure || !formVersionId}
                  >
                    Asignar evaluación
                  </ScholarshipButton>
                  <Link to="/app/becas/formularios">
                    Administrar formularios
                  </Link>
                </div>
              </form>
            </section>
            <div className="sch-two-columns">
              <section className="sch-card">
                <h2>Sesiones de capacitación</h2>
                <LoadState {...sessions} retry={sessions.reload} />
                <Notice>
                  Las ponderaciones deben sumar 100%. Actual:{" "}
                  {sessions.data?.reduce(
                    (sum, session) => sum + session.weight,
                    0,
                  ) ?? 0}
                  %. Se configuran antes del primer pase de lista y se bloquean
                  al otorgar becas.
                </Notice>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void saveSession();
                  }}
                >
                  <div className="sch-fields">
                    <ScholarshipField label="Sesión">
                      <input
                        required
                        maxLength={160}
                        disabled={busy || !canConfigureTraining}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Ponderación (%)">
                      <input
                        type="number"
                        min={0.001}
                        max={100}
                        step="0.001"
                        required
                        value={weight}
                        disabled={busy || !canConfigureTraining}
                        onChange={(e) => setWeight(e.target.valueAsNumber)}
                      />
                    </ScholarshipField>
                  </div>
                  <div className="sch-actions">
                    {sessionId && (
                      <ScholarshipButton
                        tone="secondary"
                        onClick={() => {
                          setSessionId("");
                          setName("");
                          setWeight(100);
                        }}
                      >
                        Cancelar edición
                      </ScholarshipButton>
                    )}
                    <ScholarshipButton
                      type="submit"
                      disabled={busy || !canConfigureTraining}
                    >
                      {sessionId ? "Guardar sesión" : "Agregar sesión"}
                    </ScholarshipButton>
                  </div>
                </form>
                <div className="sch-form-builder">
                  {sessions.data?.map((session) => (
                    <div key={session.id}>
                      <SessionAttendance
                        session={session}
                        applicants={
                          base.data?.applicants.filter((row) =>
                            ["VALIDATED", "AWARDED"].includes(
                              row.application.status,
                            ),
                          ) ?? []
                        }
                        onUpdate={() => {
                          sessions.reload();
                          merit.reload();
                        }}
                        editable={
                          call.status !== "DRAFT" &&
                          trainingConfigured &&
                          base.data?.grants.length === 0
                        }
                      />
                      <ScholarshipButton
                        tone="secondary"
                        disabled={busy || !canConfigureTraining}
                        onClick={() => {
                          setSessionId(session.id);
                          setName(session.name);
                          setWeight(session.weight);
                        }}
                      >
                        Editar ponderación
                      </ScholarshipButton>
                    </div>
                  ))}
                </div>
              </section>
              <aside className="sch-card">
                <h2>Reglas de selección</h2>
                <p>
                  El mérito ordena a quienes tienen documentación validada y
                  todas sus evaluaciones entregadas.
                </p>
                <Notice>
                  No hay puntaje mínimo aprobatorio. La categoría la asigna el
                  administrador. Cada beca reserva mensualidad × meses
                  financiados.
                </Notice>
                <p>La convocatoria debe estar cerrada para otorgar becas.</p>
                <div className="sch-actions">
                  <ScholarshipButton
                    tone="secondary"
                    disabled={merit.loading}
                    onClick={merit.reload}
                  >
                    Actualizar mérito
                  </ScholarshipButton>
                </div>
              </aside>
            </div>
            <section className="sch-card sch-stack">
              <h2>Orden de mérito</h2>
              <LoadState {...merit} retry={merit.reload} />
              {merit.data && (
                <div className="sch-table-wrap">
                  <table className="sch-table">
                    <thead>
                      <tr>
                        <th>Lugar</th>
                        <th>Solicitante</th>
                        <th>Examen</th>
                        <th>Asistencia</th>
                        <th>Final</th>
                        <th>Categoría</th>
                        <th>Otorgamiento</th>
                      </tr>
                    </thead>
                    <tbody>
                      {merit.data.applicants.map((row) => {
                        const grant = base.data?.grants.find(
                          (grant) => grant.studentId === row.studentId,
                        );
                        return (
                          <tr key={row.studentId}>
                            <td>{row.rank}</td>
                            <td>
                              <strong>
                                {row.firstName} {row.lastName}
                              </strong>
                            </td>
                            <td>{row.examPercent}%</td>
                            <td>{row.attendancePercent}%</td>
                            <td>
                              <strong>{row.finalPercent}%</strong>
                            </td>
                            <td>
                              {grant ? (
                                grant.categoryName
                              ) : (
                                <select
                                  aria-label={`Categoría para ${row.firstName} ${row.lastName}`}
                                  value={
                                    categories[row.studentId] ??
                                    call.categories.find(
                                      (category) => category.active,
                                    )?.id ??
                                    ""
                                  }
                                  disabled={
                                    busy ||
                                    base.loading ||
                                    merit.loading ||
                                    call.status !== "CLOSED"
                                  }
                                  onChange={(e) => {
                                    setCategories({
                                      ...categories,
                                      [row.studentId]: e.target.value,
                                    });
                                    setConfirmStudent("");
                                  }}
                                >
                                  <option value="">Selecciona categoría</option>
                                  {call.categories
                                    .filter((category) => category.active)
                                    .map((category) => (
                                      <option
                                        key={category.id}
                                        value={category.id}
                                      >
                                        {category.name} ·{" "}
                                        {money(category.monthlyAmount)}
                                      </option>
                                    ))}
                                </select>
                              )}
                            </td>
                            <td>
                              {grant ? (
                                "Beca otorgada"
                              ) : (
                                <ScholarshipButton
                                  tone="success"
                                  disabled={
                                    busy ||
                                    base.loading ||
                                    merit.loading ||
                                    call.status !== "CLOSED"
                                  }
                                  onClick={() => award(row.studentId)}
                                >
                                  {confirmStudent === row.studentId
                                    ? "Confirmar otorgamiento"
                                    : "Otorgar beca"}
                                </ScholarshipButton>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {merit.data.applicants.length === 0 && (
                    <p className="sch-empty">
                      Todavía no hay solicitantes con evaluación completa.
                    </p>
                  )}
                </div>
              )}
              {confirmStudent && (
                <Notice>
                  Confirma el otorgamiento para reservar presupuesto. Esta
                  acción registra una beca real.
                </Notice>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}
