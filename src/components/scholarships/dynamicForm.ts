import type {
  Answer,
  Answers,
  FormField,
} from "../../services/scholarship.types.ts";

export function validateAnswers(
  fields: FormField[],
  answers: Answers,
  complete: boolean,
) {
  const errors: Record<string, string> = {};
  for (const field of fields.filter((field) => field.type !== "FILE")) {
    const value = answers[field.key];
    const empty =
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);
    if (empty) {
      if (complete && field.required)
        errors[field.key] = "Este campo es obligatorio.";
      continue;
    }
    if (field.type === "NUMBER") {
      if (typeof value !== "number" || !Number.isFinite(value))
        errors[field.key] = "Ingresa un número válido.";
      else if (field.minValue !== null && value < field.minValue)
        errors[field.key] = `El mínimo es ${field.minValue}.`;
      else if (field.maxValue !== null && value > field.maxValue)
        errors[field.key] = `El máximo es ${field.maxValue}.`;
    } else if (
      field.type === "SINGLE_SELECT" &&
      !field.options.some((option) => option.value === value)
    )
      errors[field.key] = "Selecciona una opción válida.";
    else if (
      field.type === "MULTI_SELECT" &&
      (!Array.isArray(value) ||
        value.some((v) => !field.options.some((option) => option.value === v)))
    )
      errors[field.key] = "Selecciona opciones válidas.";
    else if (field.type === "YES_NO" && typeof value !== "boolean")
      errors[field.key] = "Selecciona Sí o No.";
    else if (typeof value === "string") {
      if (field.minLength !== null && value.length < field.minLength)
        errors[field.key] = `Mínimo ${field.minLength} caracteres.`;
      else if (field.maxLength !== null && value.length > field.maxLength)
        errors[field.key] = `Máximo ${field.maxLength} caracteres.`;
      else if (
        field.type === "EMAIL" &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      )
        errors[field.key] = "Ingresa un correo válido.";
      else if (field.type === "PHONE" && !/^[+0-9() .-]{7,24}$/.test(value))
        errors[field.key] = "Ingresa un teléfono válido.";
    }
  }
  return errors;
}

export function validateFile(
  field: FormField,
  file: Pick<File, "size" | "type">,
) {
  if (file.size === 0) return "El archivo está vacío.";
  if (file.size > (field.maxFileBytes ?? 10485760))
    return "El archivo supera el tamaño permitido.";
  const allowed =
    (field.allowedFileTypes.includes("PDF") &&
      file.type === "application/pdf") ||
    (field.allowedFileTypes.includes("IMAGE") &&
      ["image/jpeg", "image/png"].includes(file.type));
  return allowed ? "" : "Selecciona un archivo del formato permitido.";
}

export function displayAnswer(
  value: Answer | null | undefined,
  field: FormField,
) {
  if (value == null || value === "") return "Sin respuesta";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (Array.isArray(value))
    return value
      .map(
        (v) => field.options.find((option) => option.value === v)?.label ?? v,
      )
      .join(", ");
  return (
    field.options.find((option) => option.value === value)?.label ??
    String(value)
  );
}

export function answeredValues(answers: Answers): Answers {
  return Object.fromEntries(
    Object.entries(answers).filter(
      ([, value]) =>
        value !== "" &&
        value != null &&
        (!Array.isArray(value) || value.length > 0),
    ),
  );
}
