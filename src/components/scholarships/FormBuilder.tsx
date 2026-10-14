import { useToast } from "../../context/useToast";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { formDraftKey, readFormDraft } from "./formDraft";
import type { FormDraft } from "./formDraft";
import type {
  FieldType,
  FormField,
  ScholarshipForm,
} from "../../services/scholarship.types";
import { fieldTypes } from "../../data/scholarships";
import { scholarshipService as api } from "../../services/scholarship.service";
import { apiMessage } from "../../hooks/useApiResource";
import DynamicFields from "./DynamicFields";
import { validateAnswers } from "./dynamicForm";
import { Notice, ScholarshipButton, ScholarshipField } from "./ScholarshipUI";

function newField(type: FieldType = "SHORT_TEXT"): FormField {
  return {
    id: crypto.randomUUID(),
    key: `field_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
    label: "",
    helpText: "",
    type,
    required: true,
    sortOrder: 0,
    minLength: null,
    maxLength: null,
    minValue: null,
    maxValue: null,
    maxFileBytes: type === "FILE" ? 10485760 : null,
    allowedFileTypes: type === "FILE" ? ["PDF"] : [],
    correctAnswer: null,
    scoreWeight: null,
    options: [],
  };
}
export default function FormBuilder({
  existing,
  onSave,
}: {
  existing?: ScholarshipForm;
  onSave: (form: ScholarshipForm) => void;
}) {
  const latest = existing?.versions.toSorted(
    (a, b) => b.version - a.version,
  )[0];
  const { user } = useAuth();
  const draftKey = formDraftKey(user!.uid, existing?.id ?? "nuevo");
  const [saved] = useState(() => {
    try {
      return { draft: readFormDraft(localStorage, draftKey), error: "" };
    } catch {
      return {
        draft: null,
        error: "No se pudo leer el borrador guardado. No se ha eliminado.",
      };
    }
  });
  const [name, setName] = useState(saved.draft?.name ?? existing?.name ?? "");
  const [purpose, setPurpose] = useState<ScholarshipForm["purpose"]>(
    saved.draft?.purpose ?? existing?.purpose ?? "APPLICATION",
  );
  const [fields, setFields] = useState<FormField[]>(() =>
    (
      saved.draft?.fields ??
      latest?.fields.toSorted((a, b) => a.sortOrder - b.sortOrder) ?? [
        newField(),
      ]
    ).map((field) => ({ ...field, id: field.id ?? crypto.randomUUID() })),
  );
  // shortcut: Touch uses Subir/Bajar; add pointer dragging if touch dragging is required.
  const [dragging, setDragging] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [orderMessage, setOrderMessage] = useState("");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  function saveDraft() {
    const draft: FormDraft = {
      name,
      purpose,
      fields,
    };
    try {
      if (saved.error) throw new Error(saved.error);
      localStorage.setItem(draftKey, JSON.stringify(draft));
      toast.info(
        "Borrador guardado en este navegador. Puedes retomarlo con esta cuenta; aún no se ha publicado una versión.",
      );
    } catch {
      toast.error(
        "No se pudo guardar el borrador. Conserva esta página abierta y vuelve a intentarlo.",
      );
    }
  }
  function update(index: number, patch: Partial<FormField>) {
    setFields(
      fields.map((field, i) => (i === index ? { ...field, ...patch } : field)),
    );
  }
  function move(index: number, target: number) {
    if (
      busy ||
      index === target ||
      index < 0 ||
      target < 0 ||
      target >= fields.length
    )
      return;
    const copy = [...fields];
    const [field] = copy.splice(index, 1);
    copy.splice(target, 0, field);
    setFields(copy);
    setOrderMessage(
      `${field.label || "Pregunta sin título"} movida a la posición ${target + 1}.`,
    );
  }
  async function save() {
    if (saved.error) {
      toast.error(saved.error);
      return;
    }
    if (!name.trim()) {
      toast.error("Indica el nombre del formulario.");
      return;
    }
    if (
      !fields.length ||
      fields.some(
        (field) =>
          !field.label.trim() ||
          !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(field.key),
      )
    ) {
      toast.error("Añade preguntas con etiqueta e identificador válidos.");
      return;
    }
    if (new Set(fields.map((field) => field.key)).size !== fields.length) {
      toast.error("Los identificadores de campo deben ser únicos.");
      return;
    }
    for (const field of fields) {
      if (purpose === "EXAM" && ["PARAGRAPH", "FILE"].includes(field.type)) {
        toast.error(
          `Cambia el tipo de ${field.label}: los exámenes no admiten párrafos ni documentos.`,
        );
        return;
      }
      if (
        ["SINGLE_SELECT", "MULTI_SELECT"].includes(field.type) &&
        (field.options.length === 0 ||
          field.options.some(
            (option) => !option.value.trim() || !option.label.trim(),
          ) ||
          new Set(field.options.map((option) => option.value)).size !==
            field.options.length)
      ) {
        toast.error(`Revisa las opciones de ${field.label}.`);
        return;
      }
      if (field.type === "FILE" && field.allowedFileTypes.length === 0) {
        toast.error("Elige al menos un formato de archivo.");
        return;
      }
      if (
        purpose === "EXAM" &&
        (field.correctAnswer === null ||
          Object.keys(
            validateAnswers(
              [{ ...field, required: true }],
              { [field.key]: field.correctAnswer },
              true,
            ),
          ).length > 0)
      ) {
        toast.error(
          `Indica una respuesta correcta válida para ${field.label}.`,
        );
        return;
      }
    }
    setBusy(true);
    const payload = fields.map((field, sortOrder) => ({
      ...field,
      id: undefined,
      sortOrder,
      correctAnswer: purpose === "EXAM" ? field.correctAnswer : null,
      scoreWeight: purpose === "EXAM" ? (field.scoreWeight ?? 1) : null,
    }));
    try {
      const form = existing
        ? await api.addVersion(existing.id, payload)
        : await api.createForm(name, purpose, payload);
      try {
        localStorage.removeItem(draftKey);
      } catch {
        /* Publication succeeded even if browser storage is unavailable. */
      }
      toast.success(
        existing ? "Nueva versión publicada." : "Formulario publicado.",
      );
      onSave(form);
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="sch-card"
    >
      <div className="sch-section-heading">
        <h2>
          {existing ? `Borrador de ${existing.name}` : "Nuevo formulario"}
        </h2>
        <ScholarshipButton
          tone="secondary"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Volver al editor" : "Vista previa"}
        </ScholarshipButton>
      </div>
      <div className="sch-fields">
        <ScholarshipField label="Nombre">
          <input
            value={name}
            required
            maxLength={160}
            disabled={!!existing || busy}
            onChange={(e) => setName(e.target.value)}
          />
        </ScholarshipField>
        <ScholarshipField label="Tipo">
          <select
            value={purpose}
            disabled={!!existing || busy}
            onChange={(e) => {
              setPurpose(e.target.value as ScholarshipForm["purpose"]);
            }}
          >
            <option value="APPLICATION">Solicitud</option>
            <option value="EXAM">Examen</option>
          </select>
        </ScholarshipField>
      </div>
      <Notice error>{saved.error}</Notice>
      {saved.draft && <Notice>Borrador recuperado de este navegador.</Notice>}
      <Notice>
        Guardar borrador conserva tu avance en este navegador, incluso con
        preguntas incompletas. Publicar versión crea una versión disponible para
        convocatorias y conserva las anteriores.
      </Notice>
      {preview ? (
        <DynamicFields
          fields={fields.map((field, sortOrder) => ({ ...field, sortOrder }))}
          answers={{}}
          onChange={() => {}}
          disabled
          showDocuments
        />
      ) : (
        <div className="sch-form-builder">
          <p id="sch-drag-instructions" className="sch-muted">
            Arrastra las preguntas desde la agarradera para cambiar su orden, o
            usa Subir / Bajar.
          </p>
          <span className="sch-sr-only" role="status">
            {orderMessage}
          </span>
          {fields.map((field, index) => (
            <details
              className={`sch-builder-field${dragging === field.id ? " sch-field-dragging" : ""}${dropTarget === field.id && dragging !== field.id ? " sch-field-drop-target" : ""}`}
              key={field.id}
              open
              onDragOver={(event) => {
                if (busy || !dragging) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                setDropTarget(field.id!);
              }}
              onDrop={(event) => {
                if (
                  busy ||
                  !dragging ||
                  event.dataTransfer.getData("application/x-sizz-field") !==
                    dragging
                )
                  return;
                event.preventDefault();
                move(
                  fields.findIndex((item) => item.id === dragging),
                  index,
                );
                setDragging(null);
                setDropTarget(null);
              }}
            >
              <summary>
                <button
                  type="button"
                  className="sch-drag-handle"
                  draggable={!busy}
                  disabled={busy}
                  aria-label={`Reordenar pregunta ${index + 1}`}
                  aria-describedby="sch-drag-instructions"
                  onClick={(event) => event.preventDefault()}
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "application/x-sizz-field",
                      field.id!,
                    );
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setDragImage(
                      event.currentTarget.closest("summary")!,
                      20,
                      20,
                    );
                    setDragging(field.id!);
                  }}
                  onDragEnd={() => {
                    setDragging(null);
                    setDropTarget(null);
                  }}
                >
                  <GripVertical size={20} aria-hidden="true" />
                </button>
                {index + 1}. {field.label || "Pregunta sin título"} ·{" "}
                {fieldTypes[field.type]}
              </summary>
              <div className="sch-fields">
                <ScholarshipField label="Pregunta">
                  <input
                    required
                    maxLength={160}
                    value={field.label}
                    disabled={busy}
                    onChange={(e) => update(index, { label: e.target.value })}
                  />
                </ScholarshipField>
                <ScholarshipField label="Identificador estable">
                  <input
                    required
                    pattern="[A-Za-z][A-Za-z0-9_-]{0,63}"
                    value={field.key}
                    disabled={busy}
                    onChange={(e) => update(index, { key: e.target.value })}
                  />
                </ScholarshipField>
                <ScholarshipField label="Tipo de campo">
                  <select
                    value={field.type}
                    disabled={busy}
                    onChange={(e) => {
                      const type = e.target.value as FieldType;
                      update(index, {
                        ...newField(type),
                        id: field.id,
                        key: field.key,
                        label: field.label,
                        helpText: field.helpText,
                        required: field.required,
                      });
                    }}
                  >
                    {Object.entries(fieldTypes)
                      .filter(
                        ([type]) =>
                          purpose !== "EXAM" ||
                          !["PARAGRAPH", "FILE"].includes(type) ||
                          type === field.type,
                      )
                      .map(([type, label]) => (
                        <option
                          key={type}
                          value={type}
                          disabled={
                            purpose === "EXAM" &&
                            ["PARAGRAPH", "FILE"].includes(type)
                          }
                        >
                          {label}
                        </option>
                      ))}
                  </select>
                </ScholarshipField>
                <ScholarshipField label="Texto de ayuda">
                  <input
                    maxLength={500}
                    value={field.helpText ?? ""}
                    disabled={busy}
                    onChange={(e) =>
                      update(index, { helpText: e.target.value })
                    }
                  />
                </ScholarshipField>
                <label className="sch-checkbox">
                  <input
                    type="checkbox"
                    checked={field.required}
                    disabled={busy}
                    onChange={(e) =>
                      update(index, { required: e.target.checked })
                    }
                  />
                  Obligatorio
                </label>
                {["SHORT_TEXT", "PARAGRAPH", "EMAIL", "PHONE"].includes(
                  field.type,
                ) && (
                  <>
                    <ScholarshipField label="Longitud mínima">
                      <input
                        type="number"
                        min={0}
                        max={10000}
                        value={field.minLength ?? ""}
                        disabled={busy}
                        onChange={(e) =>
                          update(index, {
                            minLength:
                              e.target.value === ""
                                ? null
                                : e.target.valueAsNumber,
                          })
                        }
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Longitud máxima">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={field.maxLength ?? ""}
                        disabled={busy}
                        onChange={(e) =>
                          update(index, {
                            maxLength:
                              e.target.value === ""
                                ? null
                                : e.target.valueAsNumber,
                          })
                        }
                      />
                    </ScholarshipField>
                  </>
                )}
                {field.type === "NUMBER" && (
                  <>
                    <ScholarshipField label="Valor mínimo">
                      <input
                        type="number"
                        step="any"
                        value={field.minValue ?? ""}
                        disabled={busy}
                        onChange={(e) =>
                          update(index, {
                            minValue:
                              e.target.value === ""
                                ? null
                                : e.target.valueAsNumber,
                          })
                        }
                      />
                    </ScholarshipField>
                    <ScholarshipField label="Valor máximo">
                      <input
                        type="number"
                        step="any"
                        value={field.maxValue ?? ""}
                        disabled={busy}
                        onChange={(e) =>
                          update(index, {
                            maxValue:
                              e.target.value === ""
                                ? null
                                : e.target.valueAsNumber,
                          })
                        }
                      />
                    </ScholarshipField>
                  </>
                )}
                {["SINGLE_SELECT", "MULTI_SELECT"].includes(field.type) && (
                  <div className="sch-wide">
                    <h3>Opciones de respuesta</h3>
                    {field.options.map((option, optionIndex) => (
                      <div className="sch-option-row" key={optionIndex}>
                        <ScholarshipField label="Valor estable">
                          <input
                            required
                            maxLength={160}
                            disabled={busy}
                            value={option.value}
                            onChange={(e) =>
                              update(index, {
                                options: field.options.map((value, i) =>
                                  i === optionIndex
                                    ? { ...value, value: e.target.value }
                                    : value,
                                ),
                              })
                            }
                          />
                        </ScholarshipField>
                        <ScholarshipField label="Etiqueta">
                          <input
                            required
                            maxLength={160}
                            disabled={busy}
                            value={option.label}
                            onChange={(e) =>
                              update(index, {
                                options: field.options.map((value, i) =>
                                  i === optionIndex
                                    ? { ...value, label: e.target.value }
                                    : value,
                                ),
                              })
                            }
                          />
                        </ScholarshipField>
                        <ScholarshipButton
                          tone="danger"
                          disabled={busy}
                          onClick={() =>
                            update(index, {
                              options: field.options.filter(
                                (_, i) => i !== optionIndex,
                              ),
                            })
                          }
                        >
                          Quitar
                        </ScholarshipButton>
                      </div>
                    ))}
                    <ScholarshipButton
                      tone="secondary"
                      disabled={busy}
                      onClick={() =>
                        update(index, {
                          options: [...field.options, { value: "", label: "" }],
                        })
                      }
                    >
                      + Agregar opción
                    </ScholarshipButton>
                  </div>
                )}
                {field.type === "FILE" && (
                  <>
                    <ScholarshipField label="Tamaño máximo (MB)">
                      <input
                        type="number"
                        required
                        min={1}
                        max={20}
                        value={(field.maxFileBytes ?? 10485760) / 1048576}
                        disabled={busy}
                        onChange={(e) =>
                          update(index, {
                            maxFileBytes: e.target.valueAsNumber * 1048576,
                          })
                        }
                      />
                    </ScholarshipField>
                    <fieldset>
                      <legend>Formatos permitidos</legend>
                      {(["PDF", "IMAGE"] as const).map((type) => (
                        <label className="sch-checkbox" key={type}>
                          <input
                            type="checkbox"
                            disabled={busy}
                            checked={field.allowedFileTypes.includes(type)}
                            onChange={(e) =>
                              update(index, {
                                allowedFileTypes: e.target.checked
                                  ? [...field.allowedFileTypes, type]
                                  : field.allowedFileTypes.filter(
                                      (value) => value !== type,
                                    ),
                              })
                            }
                          />
                          {type === "IMAGE" ? "JPG / PNG" : "PDF"}
                        </label>
                      ))}
                    </fieldset>
                  </>
                )}
                {purpose === "EXAM" && (
                  <div className="sch-wide">
                    <h3>Clave del examen</h3>
                    <DynamicFields
                      fields={[
                        {
                          ...field,
                          label: "Respuesta correcta",
                          required: true,
                        },
                      ]}
                      answers={
                        field.correctAnswer === null
                          ? {}
                          : { [field.key]: field.correctAnswer }
                      }
                      disabled={busy}
                      onChange={(_, value) =>
                        update(index, { correctAnswer: value })
                      }
                    />
                    <ScholarshipField label="Ponderación de la pregunta">
                      <input
                        required
                        type="number"
                        min={0.001}
                        max={1000}
                        step="any"
                        value={field.scoreWeight ?? 1}
                        disabled={busy}
                        onChange={(e) =>
                          update(index, { scoreWeight: e.target.valueAsNumber })
                        }
                      />
                    </ScholarshipField>
                  </div>
                )}
              </div>
              <div className="sch-actions">
                <ScholarshipButton
                  tone="secondary"
                  disabled={busy || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  Subir
                </ScholarshipButton>
                <ScholarshipButton
                  tone="secondary"
                  disabled={busy || index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  Bajar
                </ScholarshipButton>
                <ScholarshipButton
                  tone="danger"
                  disabled={busy}
                  onClick={() =>
                    setFields(fields.filter((_, i) => i !== index))
                  }
                >
                  Eliminar campo
                </ScholarshipButton>
              </div>
            </details>
          ))}
          <ScholarshipButton
            tone="secondary"
            disabled={busy}
            onClick={() => setFields([...fields, newField()])}
          >
            + Agregar pregunta
          </ScholarshipButton>
        </div>
      )}
      <div className="sch-actions">
        <ScholarshipButton tone="secondary" disabled={busy} onClick={saveDraft}>
          Guardar borrador
        </ScholarshipButton>
        <ScholarshipButton type="submit" disabled={busy}>
          {busy
            ? "Guardando…"
            : existing
              ? "Publicar nueva versión"
              : "Publicar formulario"}
        </ScholarshipButton>
      </div>
    </form>
  );
}
