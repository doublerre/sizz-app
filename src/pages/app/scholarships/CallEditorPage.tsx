import { useToast } from "../../../context/useToast";
import DateInput from "../../../components/DateInput";
import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  ApplicationType,
  CreateCall,
} from "../../../services/scholarship.types";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../../hooks/useApiResource";
import {
  applicationTypes,
  dateLabel,
  fieldTypes,
  money,
} from "../../../data/scholarships";
import {
  AdminScholarshipNav,
  LoadState,
  Notice,
  ScholarshipButton,
  ScholarshipField,
  ScholarshipHeader,
  StatusBadge,
} from "../../../components/scholarships/ScholarshipUI";

export default function CallEditorPage() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const resource = useApiResource(
    useCallback(async () => {
      const [periods, categories, forms, calls, assignments] =
        await Promise.all([
          api.periods(),
          api.categories(),
          api.forms(),
          callId ? api.calls() : Promise.resolve([]),
          callId ? api.callForms(callId) : Promise.resolve([]),
        ]);
      return {
        periods,
        categories,
        forms,
        call: calls.find((call) => call.id === callId),
        assignments,
      };
    }, [callId]),
  );
  const [selection, setSelection] = useState<{
    callId: string | undefined;
    types: ApplicationType[];
    categoryIds: string[];
  } | null>(null);
  const [formVersionId, setFormVersionId] = useState("");
  const [assignmentType, setAssignmentType] =
    useState<ApplicationType>("NEW_ENTRY");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const data = resource.data;
  const call = data?.call;
  const types =
    selection && selection.callId === callId
      ? selection.types
      : (call?.applicationTypes ??
        (["NEW_ENTRY", "RENEWAL"] as ApplicationType[]));
  const categoryIds =
    selection && selection.callId === callId
      ? selection.categoryIds
      : (call?.categories.map((category) => category.id) ?? []);
  const selectedForm = data?.forms.find((form) =>
    form.versions.some((version) => version.id === formVersionId),
  );
  const draft = call?.status === "DRAFT";
  const paused = call?.status === "PAUSED";
  const canEditGeneral = !call || draft || paused;
  const selectedType = call?.applicationTypes.includes(assignmentType)
    ? assignmentType
    : call?.applicationTypes[0];
  async function create(form: HTMLFormElement) {
    const values = new FormData(form);
    if (!types.length || !categoryIds.length) {
      toast.error("Selecciona al menos una modalidad y categoría.");
      return;
    }
    if (String(values.get("opensOn")) > String(values.get("closesOn"))) {
      toast.error("El cierre no puede ser anterior a la apertura.");
      return;
    }
    const general = {
      name: String(values.get("name")),
      opensOn: String(values.get("opensOn")),
      closesOn: String(values.get("closesOn")),
      durationMonths: Number(values.get("durationMonths")),
      totalBudget: Number(values.get("totalBudget")),
    };
    setBusy(true);
    try {
      if (call) {
        await api.updateCall(call.id, {
          ...general,
          applicationTypes: types,
          categoryIds,
        });
        resource.reload();
        toast.success("Datos de convocatoria actualizados.");
      } else {
        const body: CreateCall = {
          ...general,
          periodId: String(values.get("periodId")),
          applicationTypes: types,
          categoryIds,
        };
        const created = await api.createCall(body);
        navigate(`/app/becas/${created.id}/editar`);
        setStep(1);
        toast.success("Borrador creado. Ahora asigna los formularios.");
      }
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function assign() {
    if (!call || !selectedForm) return;
    setBusy(true);
    try {
      await api.assignForm(call.id, formVersionId, selectedType ?? null);
      resource.reload();
      setFormVersionId("");
      toast.success("Formulario asignado.");
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  async function changeStatus(next: "OPEN" | "PAUSED" | "CLOSED") {
    if (!call) return;
    if (
      types.length !== call.applicationTypes.length ||
      types.some((type) => !call.applicationTypes.includes(type)) ||
      categoryIds.length !== call.categories.length ||
      categoryIds.some(
        (id) => !call.categories.some((category) => category.id === id),
      )
    ) {
      toast.error(
        "Guarda los cambios de modalidades y categorías antes de cambiar el estado.",
      );
      return;
    }
    if (
      next === "OPEN" &&
      !call.applicationTypes.every((type) =>
        data?.assignments.some(
          (assignment) =>
            assignment.purpose === "APPLICATION" &&
            assignment.applicationType === type,
        ),
      )
    ) {
      toast.error(
        "Asigna un formulario de solicitud a cada modalidad antes de publicar.",
      );
      return;
    }
    setBusy(true);
    try {
      await api.setCallStatus(call.id, next);
      resource.reload();
      toast.success(
        next === "PAUSED"
          ? "Convocatoria pausada."
          : next === "CLOSED"
            ? "Convocatoria cerrada."
            : paused
              ? "Convocatoria reanudada."
              : "Convocatoria publicada.",
      );
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ScholarshipHeader
        title="Editor de convocatoria"
        subtitle="Selecciona los formularios dinámicos de solicitud para cada modalidad."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav callId={callId} />
        <LoadState {...resource} retry={resource.reload} />
        {data && (!callId || call) && (
          <div className="sch-three-columns">
            <aside className="sch-card sch-steps">
              <h2>Configuración</h2>
              {["General", "Formularios de solicitud", "Publicación"].map(
                (label, index) => (
                  <button
                    key={label}
                    className={step === index ? "active" : ""}
                    disabled={!call && index > 0}
                    onClick={() => setStep(index)}
                  >
                    {index + 1} {label}
                  </button>
                ),
              )}
              <div className="sch-divider" />
              <strong>Formulario dinámico</strong>
              <small>Reutiliza versiones de la biblioteca.</small>
              <Link to="/app/becas/formularios">Administrar formularios</Link>
            </aside>
            <section className="sch-card">
              {step === 0 ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void create(e.currentTarget);
                  }}
                  key={call?.id ?? "new"}
                >
                  <h2>Datos generales</h2>
                  <div className="sch-fields">
                    <ScholarshipField label="Nombre de convocatoria" wide>
                      <input
                        name="name"
                        required
                        maxLength={200}
                        defaultValue={call?.name}
                        disabled={!canEditGeneral || busy || resource.loading}
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Periodo semestral">
                      <select
                        name="periodId"
                        required
                        defaultValue={call?.periodId ?? ""}
                        disabled={!!call || busy}
                      >
                        <option value="">Selecciona periodo</option>
                        {data.periods
                          .filter(
                            (period) =>
                              period.active || period.id === call?.periodId,
                          )
                          .map((period) => (
                            <option value={period.id} key={period.id}>
                              {period.name}
                            </option>
                          ))}
                      </select>
                    </ScholarshipField>
                    <ScholarshipField label="Meses financiados">
                      <input
                        name="durationMonths"
                        type="number"
                        required
                        min={1}
                        defaultValue={call?.durationMonths ?? 6}
                        disabled={!canEditGeneral || busy || resource.loading}
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Abre el registro">
                      <DateInput
                        name="opensOn"
                        required
                        defaultValue={call?.opensOn}
                        disabled={!canEditGeneral || busy || resource.loading}
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Cierra el registro">
                      <DateInput
                        name="closesOn"
                        required
                        defaultValue={call?.closesOn}
                        disabled={!canEditGeneral || busy || resource.loading}
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Presupuesto total (MXN)" wide>
                      <input
                        name="totalBudget"
                        type="number"
                        min={0}
                        step="0.01"
                        required
                        defaultValue={call?.totalBudget}
                        disabled={!canEditGeneral || busy || resource.loading}
                      />
                    </ScholarshipField>
                  </div>
                  <h3>Modalidades</h3>
                  {Object.entries(applicationTypes).map(([type, label]) => (
                    <label className="sch-checkbox" key={type}>
                      <input
                        type="checkbox"
                        disabled={!canEditGeneral || busy || resource.loading}
                        checked={types.includes(type as ApplicationType)}
                        onChange={(e) =>
                          setSelection({
                            callId,
                            categoryIds,
                            types: e.target.checked
                              ? [...types, type as ApplicationType]
                              : types.filter((t) => t !== type),
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                  <h3>Categorías habilitadas</h3>
                  {data.categories
                    .filter(
                      (category) =>
                        category.active ||
                        call?.categories.some((c) => c.id === category.id),
                    )
                    .map((category) => (
                      <label className="sch-checkbox" key={category.id}>
                        <input
                          type="checkbox"
                          disabled={!canEditGeneral || busy || resource.loading}
                          checked={categoryIds.includes(category.id)}
                          onChange={(e) =>
                            setSelection({
                              callId,
                              types,
                              categoryIds: e.target.checked
                                ? [...categoryIds, category.id]
                                : categoryIds.filter(
                                    (id) => id !== category.id,
                                  ),
                            })
                          }
                        />
                        {category.name} · {money(category.monthlyAmount)} / mes
                        · {category.monthlyHours} h
                      </label>
                    ))}
                  {call ? (
                    <Notice>
                      {canEditGeneral
                        ? "Puedes corregir datos, modalidades y categorías. Conserva al menos una modalidad y categoría. Las solicitudes existentes y sus formularios permanecen registrados."
                        : "Pausa la convocatoria para corregir sus datos generales sin cerrarla. Los formularios asignados conservan sus versiones y solicitudes."}
                    </Notice>
                  ) : (
                    <>
                      <Notice>
                        Configura los{" "}
                        <Link to="/app/becas/catalogos">
                          periodos y categorías
                        </Link>{" "}
                        si aún no existen.
                      </Notice>
                      <div className="sch-actions">
                        <ScholarshipButton
                          type="submit"
                          disabled={
                            busy ||
                            !data.periods.length ||
                            !data.categories.some((c) => c.active)
                          }
                        >
                          Guardar y continuar
                        </ScholarshipButton>
                      </div>
                    </>
                  )}
                  {call && canEditGeneral && (
                    <div className="sch-actions">
                      <ScholarshipButton
                        type="submit"
                        disabled={busy || resource.loading}
                      >
                        Guardar cambios
                      </ScholarshipButton>
                    </div>
                  )}
                </form>
              ) : step === 2 ? (
                <>
                  <h2>Revisión de publicación</h2>
                  <p>{call?.name}</p>
                  <Notice>
                    Al publicar se habilitan las solicitudes dentro de las
                    fechas de registro. Las versiones asignadas conservan su
                    historial.
                  </Notice>
                  <h3>Formularios asignados</h3>
                  {data.assignments
                    .filter(
                      (assignment) => assignment.purpose === "APPLICATION",
                    )
                    .map((assignment) => (
                      <p key={assignment.id}>
                        {assignment.formName} · v{assignment.version} ·{" "}
                        {assignment.applicationType
                          ? applicationTypes[assignment.applicationType]
                          : "Examen"}
                      </p>
                    ))}
                </>
              ) : (
                <>
                  <h2>Formularios de solicitud</h2>
                  <Notice>
                    Las preguntas y documentos se definen en la biblioteca de
                    formularios dinámicos. Aquí solo asignas una versión a cada
                    modalidad.
                  </Notice>
                  {data.assignments
                    .filter(
                      (assignment) => assignment.purpose === "APPLICATION",
                    )
                    .map((assignment) => {
                      const version = data.forms
                        .find((form) => form.id === assignment.formId)
                        ?.versions.find(
                          (version) => version.id === assignment.formVersionId,
                        );
                      return (
                        <article
                          className="sch-builder-field"
                          key={assignment.id}
                        >
                          <strong>
                            {assignment.formName} · v{assignment.version}
                          </strong>
                          <p>
                            {assignment.applicationType
                              ? applicationTypes[assignment.applicationType]
                              : "Evaluación"}
                          </p>
                          {version?.fields.map((field) => (
                            <p key={field.key}>
                              {field.label} · {fieldTypes[field.type]}
                              {field.required ? " · Obligatorio" : ""}
                            </p>
                          ))}
                        </article>
                      );
                    })}
                  {(draft || paused) && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void assign();
                      }}
                    >
                      <h3>Asignar versión reutilizable</h3>
                      <ScholarshipField label="Formulario y versión">
                        <select
                          required
                          value={formVersionId}
                          onChange={(e) => setFormVersionId(e.target.value)}
                        >
                          <option value="">Selecciona un formulario</option>
                          {data.forms
                            .filter(
                              (form) =>
                                form.active && form.purpose === "APPLICATION",
                            )
                            .flatMap((form) =>
                              form.versions.map((version) => (
                                <option value={version.id} key={version.id}>
                                  {form.name} · v{version.version} · Solicitud
                                </option>
                              )),
                            )}
                        </select>
                      </ScholarshipField>
                      {selectedForm?.purpose === "APPLICATION" && (
                        <ScholarshipField label="Modalidad">
                          <select
                            value={selectedType ?? ""}
                            onChange={(e) =>
                              setAssignmentType(
                                e.target.value as ApplicationType,
                              )
                            }
                          >
                            {call?.applicationTypes.map((type) => (
                              <option key={type} value={type}>
                                {applicationTypes[type]}
                              </option>
                            ))}
                          </select>
                        </ScholarshipField>
                      )}
                      <div className="sch-actions">
                        <ScholarshipButton
                          type="submit"
                          disabled={busy || resource.loading || !formVersionId}
                        >
                          Asignar formulario
                        </ScholarshipButton>
                      </div>
                    </form>
                  )}
                  <Link to="/app/becas/formularios/nuevo">
                    + Crear un formulario
                  </Link>
                </>
              )}
            </section>
            <aside className="sch-card">
              <h2>Publicación</h2>
              {call ? (
                <>
                  <StatusBadge status={call.status} />
                  <dl className="sch-metadata">
                    <dt>Registro</dt>
                    <dd>
                      {dateLabel(call.opensOn)} – {dateLabel(call.closesOn)}
                    </dd>
                    <dt>Presupuesto</dt>
                    <dd>{money(call.totalBudget)}</dd>
                    <dt>Disponible</dt>
                    <dd>{money(call.availableBudget)}</dd>
                    <dt>Duración</dt>
                    <dd>{call.durationMonths} meses</dd>
                  </dl>
                  <Notice>
                    Las evaluaciones y capacitaciones se configuran después en
                    Evaluación. No son necesarias para publicar; los alumnos
                    presentan evaluaciones tras validar su documentación.
                  </Notice>
                  {call.status !== "CLOSED" && (
                    <div className="sch-actions">
                      {(call.status === "OPEN" || paused) && (
                        <ScholarshipButton
                          tone="secondary"
                          disabled={busy || resource.loading}
                          onClick={() =>
                            void changeStatus(paused ? "OPEN" : "PAUSED")
                          }
                        >
                          {paused
                            ? "Reanudar convocatoria"
                            : "Pausar convocatoria"}
                        </ScholarshipButton>
                      )}
                      <ScholarshipButton
                        tone={draft ? "yellow" : "secondary"}
                        disabled={busy || resource.loading}
                        onClick={() =>
                          void changeStatus(draft ? "OPEN" : "CLOSED")
                        }
                      >
                        {draft
                          ? "Publicar convocatoria"
                          : "Cerrar convocatoria"}
                      </ScholarshipButton>
                    </div>
                  )}
                  <div className="sch-actions">
                    <Link to={`/app/becas/${call.id}/postulaciones`}>
                      Ver postulaciones →
                    </Link>
                  </div>
                </>
              ) : (
                <Notice>
                  Guarda los datos generales para asignar formularios y
                  publicar.
                </Notice>
              )}
            </aside>
          </div>
        )}
        {data && callId && !call && (
          <Notice error>Convocatoria no encontrada.</Notice>
        )}
      </main>
    </>
  );
}
