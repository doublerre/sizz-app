import { useId } from "react";
import DateInput from "../DateInput";
import type {
  Answer,
  Answers,
  FormField,
} from "../../services/scholarship.types";

export default function DynamicFields({
  fields,
  answers,
  onChange,
  errors = {},
  disabled = false,
  showDocuments = false,
}: {
  fields: FormField[];
  answers: Answers;
  onChange: (key: string, value: Answer) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  showDocuments?: boolean;
}) {
  const prefix = useId();
  return (
    <div className="sch-fields">
      {fields
        .filter((field) => showDocuments || field.type !== "FILE")
        .toSorted((a, b) => a.sortOrder - b.sortOrder)
        .map((field) => {
          const id = `${prefix}-${field.key}`;
          const value = answers[field.key];
          const common = {
            id,
            disabled,
            required: field.required,
            "aria-invalid": !!errors[field.key],
            "aria-describedby": `${id}-help`,
          };
          return (
            <div
              key={field.key}
              className={`sch-field ${field.type === "PARAGRAPH" || field.type === "MULTI_SELECT" ? "sch-wide" : ""}`}
            >
              <label htmlFor={id}>
                {field.label}
                {field.required ? " *" : ""}
              </label>
              {field.type === "FILE" ? (
                <>
                  <input
                    {...common}
                    type="file"
                    accept={field.allowedFileTypes
                      .map((type) =>
                        type === "PDF"
                          ? "application/pdf"
                          : "image/jpeg,image/png",
                      )
                      .join(",")}
                  />
                  <small>
                    {field.allowedFileTypes
                      .map((type) => (type === "IMAGE" ? "JPG / PNG" : type))
                      .join(" / ")}{" "}
                    · Máximo {(field.maxFileBytes ?? 10485760) / 1048576} MB
                  </small>
                </>
              ) : field.type === "PARAGRAPH" ? (
                <textarea
                  {...common}
                  minLength={field.minLength ?? undefined}
                  maxLength={field.maxLength ?? undefined}
                  value={String(value ?? "")}
                  onChange={(e) => onChange(field.key, e.target.value)}
                />
              ) : field.type === "SINGLE_SELECT" ? (
                <select
                  {...common}
                  value={String(value ?? "")}
                  onChange={(e) => onChange(field.key, e.target.value)}
                >
                  <option value="">Selecciona una opción</option>
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "YES_NO" ? (
                <select
                  {...common}
                  value={value === undefined ? "" : String(value)}
                  onChange={(e) => {
                    if (e.target.value === "") onChange(field.key, "");
                    else onChange(field.key, e.target.value === "true");
                  }}
                >
                  <option value="">Selecciona</option>
                  <option value="true">Sí</option>
                  <option value="false">No</option>
                </select>
              ) : field.type === "MULTI_SELECT" ? (
                <fieldset
                  id={id}
                  aria-describedby={`${id}-help`}
                  disabled={disabled}
                >
                  <legend className="sch-sr-only">{field.label}</legend>
                  {field.options.map((option) => (
                    <label className="sch-checkbox" key={option.value}>
                      <input
                        type="checkbox"
                        checked={
                          Array.isArray(value) && value.includes(option.value)
                        }
                        onChange={(e) => {
                          const selected = Array.isArray(value) ? value : [];
                          onChange(
                            field.key,
                            e.target.checked
                              ? [...selected, option.value]
                              : selected.filter((v) => v !== option.value),
                          );
                        }}
                      />
                      {option.label}
                    </label>
                  ))}
                </fieldset>
              ) : field.type === "DATE" ? (
                <DateInput
                  {...common}
                  value={String(value ?? "")}
                  onChange={(event) => onChange(field.key, event.target.value)}
                />
              ) : (
                <input
                  {...common}
                  type={
                    field.type === "NUMBER"
                      ? "number"
                      : field.type === "TIME"
                        ? "time"
                        : field.type === "EMAIL"
                          ? "email"
                          : field.type === "PHONE"
                            ? "tel"
                            : "text"
                  }
                  step={field.type === "NUMBER" ? "any" : undefined}
                  min={field.minValue ?? undefined}
                  max={field.maxValue ?? undefined}
                  minLength={field.minLength ?? undefined}
                  maxLength={field.maxLength ?? undefined}
                  value={
                    typeof value === "number" || typeof value === "string"
                      ? value
                      : ""
                  }
                  onChange={(e) =>
                    onChange(
                      field.key,
                      field.type === "NUMBER" && e.target.value !== ""
                        ? e.target.valueAsNumber
                        : e.target.value,
                    )
                  }
                />
              )}
              <small
                id={`${id}-help`}
                className={errors[field.key] ? "sch-field-error" : ""}
              >
                {errors[field.key] ?? field.helpText}
              </small>
            </div>
          );
        })}
    </div>
  );
}
