import { useCallback, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  X,
  ChevronDown,
  Eye,
} from "lucide-react";
import ReservationDynamicForm from "@/components/ReservationDynamicForm";
import { useToast } from "@/context/useToast";
import { apiMessage, useApiResource } from "@/hooks/useApiResource";
import {
  createDefaultReservationForm,
  reservationFormsService,
  type ReservationAnswers,
  type ReservationFieldType,
  type ReservationForm,
  type ReservationFormRequest,
  type ReservationFormField,
  type ReservationFormSection,
} from "@/services/reservation-forms.service";
import { reservationsService, type ActivityOption } from "@/services/reservations.service";
import "./reservations.css";

type FormSection = ReservationFormSection;

const fieldTypeLabels: Record<ReservationFieldType, string> = {
  SHORT_TEXT: "Texto corto",
  LONG_TEXT: "Texto largo",
  NUMBER: "Número",
  EMAIL: "Correo electrónico",
  PHONE: "Teléfono",
  DATE: "Fecha",
  TIME: "Hora",
  SINGLE_SELECT: "Selección única",
  MULTI_SELECT: "Selección múltiple",
  YES_NO: "Sí / No",
  CHECKBOX: "Casilla de verificación",
};

/* ─── Utilidades ─── */

function newField(): ReservationFormField {
  return {
    id: crypto.randomUUID(),
    label: "",
    type: "SHORT_TEXT",
    required: true,
    options: [],
  };
}

/* ─── Subcomponentes ─── */

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
  id?: string;
}

function FilterSelect({ value, onChange, options, ariaLabel, id }: FilterSelectProps) {
  return (
    <div className="res-select">
      <select
        id={id}
        className="res-select__control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="res-select__chevron" aria-hidden="true" />
    </div>
  );
}

/* ─── Form Builder (vista de edición) ─── */

function ReservationFormBuilder({
  existing,
  activities,
  onSave,
  onCancel,
}: {
  existing?: ReservationForm;
  activities: ActivityOption[];
  onSave: (form: ReservationFormRequest, active: boolean) => Promise<void>;
  onCancel: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState(existing?.name ?? "Nuevo formulario");
  const [activityId, setActivityId] = useState(existing?.activityId ?? "");
  const [active, setActive] = useState(existing?.active ?? true);
  const [sections, setSections] = useState<FormSection[]>(() => existing?.sections ?? createDefaultReservationForm().sections.map((section) => ({
    ...section,
    id: crypto.randomUUID(),
    fields: section.fields.map((field) => ({ ...field, id: crypto.randomUUID() })),
  })));
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const [activeField, setActiveField] = useState<string | null>(sections[0]?.fields[0]?.id ?? null);
  const [preview, setPreview] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<ReservationAnswers>({});
  const [saving, setSaving] = useState(false);

  const currentSection = sections.find((s) => s.id === activeSection);
  const currentField = currentSection?.fields.find((f) => f.id === activeField);
  const totalFields = sections.reduce((sum, s) => sum + s.fields.length, 0);

  const updateField = (sectionId: string, fieldId: string, patch: Partial<ReservationFormField>) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.map((f) => (f.id === fieldId ? { ...f, ...patch } : f)) }
          : s,
      ),
    );
  };

  const addField = (sectionId: string) => {
    const field = newField();
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, field] } : s,
      ),
    );
    setActiveField(field.id);
  };

  const removeField = (sectionId: string, fieldId: string) => {
    const remainingFields = sections.find((section) => section.id === sectionId)?.fields.filter((field) => field.id !== fieldId) ?? [];
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((f) => f.id !== fieldId) }
          : s,
      ),
    );
    if (activeField === fieldId) setActiveField(remainingFields[0]?.id ?? null);
  };

  const addOption = (sectionId: string, fieldId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId ? { ...f, options: [...f.options, "Nueva opción"] } : f,
              ),
            }
          : s,
      ),
    );
  };

  const updateOption = (sectionId: string, fieldId: string, idx: number, value: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId
                  ? {
                      ...f,
                      options: f.options.map((o, i) => (i === idx ? value : o)),
                    }
                  : f,
              ),
            }
          : s,
      ),
    );
  };

  const removeOption = (sectionId: string, fieldId: string, idx: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              fields: s.fields.map((f) =>
                f.id === fieldId
                  ? { ...f, options: f.options.filter((_, i) => i !== idx) }
                  : f,
              ),
            }
          : s,
      ),
    );
  };

  const addSection = () => {
    const section: FormSection = {
      id: crypto.randomUUID(),
      name: "Nueva sección",
      fields: [],
    };
    setSections((prev) => [...prev, section]);
    setActiveSection(section.id);
    setActiveField(null);
  };

  const removeSection = (sectionId: string) => {
    const remaining = sections.filter((section) => section.id !== sectionId);
    setSections(remaining);
    if (activeSection === sectionId) {
      setActiveSection(remaining[0]?.id ?? "");
      setActiveField(remaining[0]?.fields[0]?.id ?? null);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Escribe el nombre del formulario.");
      return;
    }
    if (sections.some((section) => !section.name.trim())) {
      toast.error("Todas las secciones necesitan un nombre.");
      return;
    }
    if (totalFields === 0) {
      toast.error("Agrega al menos una pregunta al formulario.");
      return;
    }
    if (sections.some((section) => section.fields.some((field) =>
      !field.label.trim() ||
      (["SINGLE_SELECT", "MULTI_SELECT"].includes(field.type) &&
        (field.options.length === 0 || field.options.some((option) => !option.trim()))),
    ))) {
      toast.error("Completa los títulos de las preguntas y sus opciones.");
      return;
    }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), activityId: activityId || null, sections }, active);
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setSaving(false);
    }
  };


  return (
    <div>
      {/* Top bar */}
      <div className="res-form-topbar">
        <div className="res-form-topbar__left">
          <input className="res-form-name-input" value={name} onChange={(event) => setName(event.target.value)} aria-label="Nombre del formulario" maxLength={120} />
          <span className={`res-badge ${active ? "res-badge--published" : "res-badge--draft"}`}>{active ? "ACTIVO" : "INACTIVO"}</span>
        </div>
        <div className="res-form-topbar__right">
          <span className="res-form-topbar__saved">Los cambios se guardan al publicar</span>
          <button className="res-form-topbar__preview" type="button" onClick={() => { setPreview((value) => !value); setPreviewAnswers({}); }}>
            <Eye size={14} style={{ marginRight: 4 }} />
            {preview ? "Volver al editor" : "Vista previa"}
          </button>
          <button className="res-btn-primary" type="button" onClick={() => void handleSave()} disabled={saving}>{saving ? "Guardando…" : "Guardar cambios"}</button>
        </div>
      </div>

      {/* 3 column layout */}
      {preview ? (
        <div className="res-card reservation-form-preview">
          <ReservationDynamicForm
            form={{ id: existing?.id ?? "preview", name, activityId: activityId || null, active, sections, updatedAt: existing?.updatedAt ?? "" }}
            answers={previewAnswers}
            onChange={(fieldId, value) => setPreviewAnswers((current) => ({ ...current, [fieldId]: value }))}
          />
        </div>
      ) : <div className="res-forms-layout">
        {/* Sidebar — Secciones */}
        <div className="res-forms-sidebar">
          <h3 className="res-forms-sidebar__title">Preguntas</h3>
          <p className="res-forms-sidebar__count">{totalFields} activas</p>

          <ul className="res-forms-section-list">
            {sections.map((section, idx) => (
              <li key={section.id}>
                <button
                  className={`res-forms-section-item${section.id === activeSection ? " res-forms-section-item--active" : ""}`}
                  onClick={() => {
                    setActiveSection(section.id);
                    setActiveField(section.fields[0]?.id ?? null);
                  }}
                >
                  <span className="res-forms-section-item__num">{idx + 1}</span>
                  <span className="res-forms-section-item__text">
                    <span className="res-forms-section-item__name">{section.name}</span>
                    <span className="res-forms-section-item__fields">
                      {section.fields.length} pregunta{section.fields.length !== 1 ? "s" : ""}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {currentSection && currentSection.fields.length > 0 && (
            <ul className="res-forms-field-list" aria-label={`Preguntas de ${currentSection.name}`}>
              {currentSection.fields.map((field, index) => (
                <li key={field.id}>
                  <button
                    type="button"
                    className={`res-forms-field-item${field.id === activeField ? " res-forms-field-item--active" : ""}`}
                    onClick={() => setActiveField(field.id)}
                  >
                    <span>{index + 1}.</span> {field.label || "Pregunta sin título"}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button className="res-forms-add-btn" type="button" disabled={!activeSection} onClick={addField.bind(null, activeSection)}>
            <Plus size={14} />
            Agregar pregunta
          </button>
          <button className="res-forms-add-btn" type="button" onClick={addSection}>
            <Plus size={14} />
            Agregar sección
          </button>

          <p className="res-forms-hint">
            <strong>FORMULARIO DINÁMICO</strong><br />
            Las preguntas se mostrarán al reservar y se adjuntarán a la solicitud.
          </p>
        </div>

        {/* Editor central */}
        <div className="res-forms-editor">
          <div className="res-forms-editor__header">
            <h3 className="res-forms-editor__title">
              {currentField ? "Editar pregunta" : "Selecciona una pregunta"}
            </h3>
            {currentField?.required && (
              <span className="res-badge res-badge--required">OBLIGATORIA</span>
            )}
          </div>

          {currentField && currentSection ? (
            <>
              <div className="res-field-group">
                <label htmlFor="section-name">Nombre de la sección</label>
                <input id="section-name" type="text" maxLength={100} value={currentSection.name} onChange={(event) => setSections((current) => current.map((section) => section.id === currentSection.id ? { ...section, name: event.target.value } : section))} />
              </div>
              <div className="res-field-group">
                <label htmlFor="field-label">Título</label>
                <input
                  id="field-label"
                  type="text"
                  maxLength={120}
                  value={currentField.label}
                  onChange={(e) =>
                    updateField(currentSection.id, currentField.id, { label: e.target.value })
                  }
                  placeholder="Escribe el título de la pregunta"
                />
              </div>

              <div className="res-field-row">
                <div className="res-field-group">
                  <label htmlFor="field-type">Tipo de respuesta</label>
                  <FilterSelect
                    value={currentField.type}
                    onChange={(value) =>
                      updateField(currentSection.id, currentField.id, {
                        type: value as ReservationFieldType,
                      })
                    }
                    options={Object.entries(fieldTypeLabels).map(([value, label]) => ({
                      value,
                      label,
                    }))}
                    ariaLabel="Tipo de respuesta"
                    id="field-type"
                  />
                </div>
                <button className="res-btn-secondary" type="button" onClick={() => removeSection(currentSection.id)}>Eliminar sección</button>
              </div>

              <div className="res-field-group">
                <label htmlFor="field-help-text">Texto de ayuda (opcional)</label>
                <input id="field-help-text" type="text" maxLength={240} value={currentField.helpText ?? ""} onChange={(event) => updateField(currentSection.id, currentField.id, { helpText: event.target.value })} />
              </div>

              {(currentField.type === "SHORT_TEXT" || currentField.type === "LONG_TEXT") && (
                <div className="res-field-row">
                  <div className="res-field-group">
                    <label htmlFor="field-min-length">Longitud mínima</label>
                    <input id="field-min-length" type="number" min={0} value={currentField.minLength ?? ""} onChange={(event) => updateField(currentSection.id, currentField.id, { minLength: event.target.value === "" ? null : Number(event.target.value) })} />
                  </div>
                  <div className="res-field-group">
                    <label htmlFor="field-max-length">Longitud máxima</label>
                    <input id="field-max-length" type="number" min={0} value={currentField.maxLength ?? ""} onChange={(event) => updateField(currentSection.id, currentField.id, { maxLength: event.target.value === "" ? null : Number(event.target.value) })} />
                  </div>
                </div>
              )}
              {currentField.type === "NUMBER" && (
                <div className="res-field-row">
                  <div className="res-field-group">
                    <label htmlFor="field-min-value">Valor mínimo</label>
                    <input id="field-min-value" type="number" value={currentField.minValue ?? ""} onChange={(event) => updateField(currentSection.id, currentField.id, { minValue: event.target.value === "" ? null : Number(event.target.value) })} />
                  </div>
                  <div className="res-field-group">
                    <label htmlFor="field-max-value">Valor máximo</label>
                    <input id="field-max-value" type="number" value={currentField.maxValue ?? ""} onChange={(event) => updateField(currentSection.id, currentField.id, { maxValue: event.target.value === "" ? null : Number(event.target.value) })} />
                  </div>
                </div>
              )}

              {/* Opciones para SELECT */}
              {currentField.type.includes("SELECT") && (
                <>
                  <div className="res-field-group">
                    <label>Opciones</label>
                    <div className="res-options-list">
                      {currentField.options.map((opt, idx) => (
                        <div className="res-option-row" key={idx}>
                          <div className="res-option-row__text">
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateOption(currentSection.id, currentField.id, idx, e.target.value)
                              }
                              style={{
                                border: "none",
                                background: "transparent",
                                outline: "none",
                                width: "100%",
                                fontFamily: "inherit",
                                fontSize: "0.85rem",
                                color: "#1a1a2e",
                              }}
                            />
                          </div>
                          <button
                            className="res-option-row__remove"
                            onClick={() =>
                              removeOption(currentSection.id, currentField.id, idx)
                            }
                            type="button"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      className="res-add-option"
                      onClick={() => addOption(currentSection.id, currentField.id)}
                      type="button"
                    >
                      <Plus size={14} />
                      Agregar opción
                    </button>
                  </div>
                </>
              )}

              {/* Checkboxes */}
              <div className="res-checkbox-row">
                <input
                  type="checkbox"
                  id="required-check"
                  checked={currentField.required}
                  onChange={(e) =>
                    updateField(currentSection.id, currentField.id, {
                      required: e.target.checked,
                    })
                  }
                />
                <label htmlFor="required-check">Respuesta obligatoria</label>
              </div>
              <div className="res-editor-footer">
                <button className="res-btn-secondary" onClick={() => removeField(currentSection.id, currentField.id)} type="button">
                  Eliminar pregunta
                </button>
                <button className="res-btn-secondary" onClick={onCancel} type="button">
                  Cancelar
                </button>
                <button className="res-btn-primary" onClick={() => void handleSave()} type="button" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar formulario"}
                </button>
              </div>
            </>
          ) : (
            <p style={{ color: "#718096", fontSize: "0.85rem" }}>
              Selecciona una pregunta para editarla.
            </p>
          )}
        </div>

        {/* Configuración */}
        <div className="res-forms-config">
          <h3 className="res-forms-config__title">Configuración</h3>

          <div className="res-config-group">
            <div className="res-config-group__label">Aplicación</div>
            <select aria-label="Actividad del formulario" value={activityId} onChange={(event) => setActivityId(event.target.value)}>
              <option value="">Formulario global</option>
              {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </select>
          </div>

          <div className="res-config-group">
            <div className="res-config-group__label">Publicación</div>
            <div className="res-config-check">
              <input type="checkbox" id="form-active" checked={active} onChange={(event) => setActive(event.target.checked)} />
              <label htmlFor="form-active">Formulario activo para nuevas solicitudes</label>
            </div>
          </div>

          <div className="res-config-group">
            <div className="res-config-group__label">Reglas de reservación</div>
            <p>La API valida fechas futuras, disponibilidad, cupo y actividades reservables al enviar cada solicitud.</p>
          </div>

          <div className="res-config-meta">
            <strong>Última actualización</strong><br />
            {existing?.updatedAt ? new Date(existing.updatedAt).toLocaleString("es-MX") : "Aún no publicado"}
            <br /><br /><strong>Versiones</strong><br />
            {existing?.versions?.length ?? 0} registrada(s) · última publicada: {existing?.versions?.filter((version) => version.published).sort((a, b) => b.versionNumber - a.versionNumber)[0]?.versionNumber ?? "ninguna"}
            <br /><br />Las versiones publicadas no cambian las respuestas de reservaciones existentes.
          </div>
        </div>
      </div>
      }
    </div>
  );
}

/* ─── Página principal ─── */

export default function AdminReservationForms() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const isNew = formId === "nuevo" || formId === "new";
  const loadPageData = useCallback(async () => {
    const [loadedForms, loadedActivities, detailedForm] = await Promise.all([
      reservationFormsService.list(),
      reservationsService.getActivities(),
      formId && !isNew ? reservationFormsService.get(formId) : Promise.resolve(null),
    ]);
    return {
      forms: detailedForm
        ? loadedForms.map((form) => form.id === detailedForm.id ? detailedForm : form)
        : loadedForms,
      activities: loadedActivities,
    };
  }, [formId, isNew]);
  const { data: pageData, loading, error: loadError, reload } = useApiResource(loadPageData);
  const forms = pageData?.forms ?? [];
  const activities = (pageData?.activities ?? []).filter((activity) => activity.active && activity.isReservable);

  const existingForm = forms.find((f) => f.id === formId);

  const handleSave = async (request: ReservationFormRequest, publish: boolean) => {
    setSaving(true);
    try {
      const form = existingForm
        ? await reservationFormsService.update(existingForm.id, request)
        : await reservationFormsService.create(request);
      if (!existingForm) {
        navigate(`/app/reservaciones/formularios/${form.id}`, { replace: true });
      }
      if (publish) await reservationFormsService.publish(form.id);
      toast.success(publish ? "El formulario se publicó correctamente." : "El borrador se guardó correctamente.");
      navigate(publish ? "/app/reservaciones/formularios" : `/app/reservaciones/formularios/${form.id}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (form: ReservationForm) => {
    try {
      if (form.active) await reservationFormsService.deactivate(form.id);
      else await reservationFormsService.publish(form.id);
      toast.success(form.active ? "Formulario desactivado." : "Formulario publicado.");
      reload();
    } catch (error) {
      toast.error(apiMessage(error));
    }
  };

  return (
    <div className="res-page">
      <header className="res-head">
        <div className="res-head__text">
          <h1 className="res-head__title">Formulario de reservaciones</h1>
          <p className="res-head__subtitle">
            Editor dinámico · Formularios versionados y compartidos por actividad
          </p>
        </div>
        <div className="res-head__actions">
          {formId && (isNew || existingForm) && (
            <Link className="res-btn-secondary" to="/app/reservaciones/formularios">
              <ArrowLeft size={16} strokeWidth={2.6} />
              Volver
            </Link>
          )}
        </div>
      </header>

      <div className="res-content">
        {loadError && <p className="res-empty" role="alert">{loadError} <button type="button" onClick={reload}>Reintentar</button></p>}
        {formId && !isNew && loading && !existingForm ? <p className="res-empty">Cargando formulario…</p> : (isNew || existingForm) ? (
          <ReservationFormBuilder
            existing={existingForm}
            activities={activities}
            onSave={handleSave}
            onCancel={() => navigate("/app/reservaciones/formularios")}
          />
        ) : (
          /* Biblioteca de formularios */
          <div className="res-forms-library">
            <div className="res-forms-library__header">
              <div>
                <h2 className="res-forms-library__title">Biblioteca de formularios</h2>
                <p className="res-form-storage-note">Los formularios publicados se comparten con el flujo de reservación y conservan sus versiones históricas.</p>
              </div>
              <Link className="res-btn-primary" to="/app/reservaciones/formularios/nuevo">
                <Plus size={16} strokeWidth={2.6} />
                Crear formulario
              </Link>
            </div>

            {loading ? <p className="res-empty">Cargando formularios…</p> : <div className="res-table-wrap">
              <table className="res-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Aplicación</th>
                    <th>Versión</th>
                    <th>Secciones</th>
                    <th>Preguntas</th>
                    <th>Estado</th>
                    <th>Última actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {forms.map((form) => (
                    <tr key={form.id}>
                      <td>
                        <Link
                          className="res-folio-link"
                          to={`/app/reservaciones/formularios/${form.id}`}
                        >
                          {form.name}
                        </Link>
                      </td>
                      <td>{form.activityId ? activities.find((activity) => activity.id === form.activityId)?.name ?? "Actividad" : "Global"}</td>
                      <td>{form.versions?.length ? `v${Math.max(...form.versions.map((version) => version.versionNumber))}` : "Borrador"}</td>
                      <td>{form.sections.length}</td>
                      <td>
                        {form.sections.reduce((sum, s) => sum + s.fields.length, 0)}
                      </td>
                      <td>
                        <span
                          className={`res-status ${form.active ? "res-status--approved" : "res-status--pending"}`}
                        >
                          {form.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td>
                        {form.updatedAt ? new Date(form.updatedAt).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        }) : "—"}
                      </td>
                      <td>
                        <div className="res-more res-form-actions">
                          <Link className="res-folio-link" to={`/app/reservaciones/formularios/${form.id}`}>Editar</Link>
                          <button type="button" className="res-btn-secondary" disabled={saving} onClick={() => void handleToggleActive(form)}>
                            {form.active ? "Desactivar" : "Publicar"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>}

            {!loading && !loadError && forms.length === 0 && (
              <p className="res-empty">
                Crea un formulario para asignarlo a las reservaciones.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
