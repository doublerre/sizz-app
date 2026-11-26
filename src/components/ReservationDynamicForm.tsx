import type {
  ReservationAnswer,
  ReservationAnswers,
  ReservationForm,
} from "@/services/reservation-forms.service";
import DateInput from "@/components/DateInput";

interface Props {
  form: ReservationForm;
  answers: ReservationAnswers;
  errors?: Record<string, string>;
  onChange: (fieldId: string, value: ReservationAnswer) => void;
}

export default function ReservationDynamicForm({ form, answers, errors = {}, onChange }: Props) {
  return (
    <div className="reservation-dynamic-form">
      <h2 className="form-section-title">{form.name}</h2>
      {form.sections.map((section) => (
        <section className="form-section" key={section.id}>
          <h3 className="form-section-title">{section.name}</h3>
          {section.fields.map((field) => {
            const value = answers[field.id];
            const error = errors[field.id];
            const id = `reservation-field-${field.id}`;
            return (
              <div className="form-field" key={field.id}>
                <label className="form-label" htmlFor={id}>
                  {field.label || "Pregunta sin título"}{field.required && <span aria-hidden="true"> *</span>}
                </label>
                {field.type === "LONG_TEXT" ? (
                  <textarea
                    id={id}
                    className="form-input"
                    value={typeof value === "string" ? value : ""}
                    required={field.required}
                    minLength={field.minLength ?? undefined}
                    maxLength={field.maxLength ?? undefined}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(field.id, event.target.value)}
                  />
                ) : field.type === "SINGLE_SELECT" ? (
                  <select
                    id={id}
                    className="form-input"
                    value={typeof value === "string" ? value : ""}
                    required={field.required}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(field.id, event.target.value)}
                  >
                    <option value="">Selecciona una opción</option>
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : field.type === "MULTI_SELECT" ? (
                  <div className="reservation-dynamic-options" id={id}>
                    {field.options.map((option) => {
                      const selected = Array.isArray(value) && value.includes(option);
                      return (
                        <label className="reservation-dynamic-option" key={option}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const current = Array.isArray(value) ? value : [];
                              onChange(field.id, event.target.checked
                                ? [...current, option]
                                : current.filter((item) => item !== option));
                            }}
                          />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                ) : field.type === "YES_NO" ? (
                  <div className="reservation-dynamic-options" id={id}>
                    {[{ label: "Sí", value: true }, { label: "No", value: false }].map((option) => (
                      <label className="reservation-dynamic-option" key={option.label}>
                        <input
                          type="radio"
                          name={id}
                          checked={value === option.value}
                          onChange={() => onChange(field.id, option.value)}
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                ) : field.type === "CHECKBOX" ? (
                  <label className="reservation-dynamic-option" htmlFor={id}>
                    <input
                      id={id}
                      type="checkbox"
                      checked={value === true}
                      onChange={(event) => onChange(field.id, event.target.checked)}
                    />
                    Sí
                  </label>
                ) : field.type === "DATE" ? (
                  <DateInput
                    id={id}
                    className="form-input"
                    value={typeof value === "string" ? value : ""}
                    required={field.required}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(field.id, event.target.value)}
                  />
                ) : (
                  <input
                    id={id}
                    className="form-input"
                    type={inputType(field.type)}
                    value={typeof value === "string" || typeof value === "number" ? value : ""}
                    required={field.required}
                    min={field.type === "NUMBER" ? field.minValue ?? undefined : undefined}
                    max={field.type === "NUMBER" ? field.maxValue ?? undefined : undefined}
                    minLength={field.type !== "NUMBER" ? field.minLength ?? undefined : undefined}
                    maxLength={field.type !== "NUMBER" ? field.maxLength ?? undefined : undefined}
                    aria-invalid={Boolean(error)}
                    onChange={(event) => onChange(field.id, field.type === "NUMBER"
                      ? event.target.value === "" ? "" : Number(event.target.value)
                      : event.target.value)}
                  />
                )}
                {field.helpText && <small className="reservation-dynamic-help">{field.helpText}</small>}
                {error && <small className="reservation-dynamic-error" role="alert">{error}</small>}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function inputType(type: string): string {
  switch (type) {
    case "EMAIL": return "email";
    case "PHONE": return "tel";
    case "TIME": return "time";
    case "NUMBER": return "number";
    default: return "text";
  }
}