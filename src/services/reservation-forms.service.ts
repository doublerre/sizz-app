import api from "./api.ts";

export type ReservationFieldType =
  | "SHORT_TEXT"
  | "LONG_TEXT"
  | "NUMBER"
  | "EMAIL"
  | "PHONE"
  | "DATE"
  | "TIME"
  | "SINGLE_SELECT"
  | "MULTI_SELECT"
  | "YES_NO"
  | "CHECKBOX";

export type ReservationAnswer = string | number | boolean | string[];
export type ReservationAnswers = Record<string, ReservationAnswer>;

export interface ReservationFormField {
  id: string;
  label: string;
  type: ReservationFieldType;
  required: boolean;
  options: string[];
  helpText?: string | null;
  sortOrder?: number;
  minLength?: number | null;
  maxLength?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
}

export interface ReservationFormSection {
  id: string;
  name: string;
  sortOrder?: number;
  fields: ReservationFormField[];
}

export interface ReservationForm {
  id: string;
  name: string;
  activityId: string | null;
  active: boolean;
  sections: ReservationFormSection[];
  updatedAt: string;
  versions?: ReservationFormVersion[];
}

export interface ReservationFormVersion {
  id: string;
  formId: string;
  versionNumber: number;
  published: boolean;
  createdAt: string;
  publishedAt: string | null;
  sections: ReservationFormSection[];
}

export type ActiveReservationForm = ReservationFormVersion;

export interface ReservationFormRequest {
  name: string;
  activityId: string | null;
  sections: ReservationFormSection[];
}

const defaultReservationForm: ReservationForm = {
  id: "reservation-groups-default",
  name: "Reservación para grupos — Estándar",
  activityId: null,
  active: true,
  updatedAt: "",
  sections: [
    {
      id: "contact",
      name: "Datos de contacto",
      fields: [
        { id: "school-level", label: "Nivel educativo", type: "SINGLE_SELECT", required: true, options: ["Primaria", "Secundaria", "Preparatoria", "Universidad"] },
        { id: "own-transport", label: "¿Cuentan con transporte propio?", type: "YES_NO", required: true, options: [] },
      ],
    },
    {
      id: "group",
      name: "Datos del grupo",
      fields: [
        { id: "transport-notes", label: "Observaciones de transporte", type: "LONG_TEXT", required: false, options: [] },
        { id: "additional-notes", label: "Observaciones adicionales", type: "LONG_TEXT", required: false, options: [] },
        { id: "image-consent", label: "Autorizo el uso de imágenes", type: "CHECKBOX", required: false, options: [] },
      ],
    },
  ],
};

export function createDefaultReservationForm(): ReservationForm {
  return JSON.parse(JSON.stringify(defaultReservationForm)) as ReservationForm;
}

export const reservationFormsService = {
  async list(): Promise<ReservationForm[]> {
    const { data } = await api.get<ReservationForm[]>("/admin/reservation-forms");
    return data;
  },

  async get(id: string): Promise<ReservationForm> {
    const { data } = await api.get<ReservationForm>(`/admin/reservation-forms/${encodeURIComponent(id)}`);
    return data;
  },

  async create(request: ReservationFormRequest): Promise<ReservationForm> {
    const { data } = await api.post<ReservationForm>("/admin/reservation-forms", request);
    return data;
  },

  async update(id: string, request: ReservationFormRequest): Promise<ReservationForm> {
    const { data } = await api.put<ReservationForm>(`/admin/reservation-forms/${encodeURIComponent(id)}`, request);
    return data;
  },

  async publish(id: string): Promise<ReservationForm> {
    const { data } = await api.post<ReservationForm>(`/admin/reservation-forms/${encodeURIComponent(id)}/publish`);
    return data;
  },

  async deactivate(id: string): Promise<void> {
    await api.delete(`/admin/reservation-forms/${encodeURIComponent(id)}`);
  },

  async getActive(activityId: string): Promise<ActiveReservationForm | null> {
    try {
      const { data } = await api.get<ActiveReservationForm>("/reservation-forms/active", { params: { activityId } });
      return data;
    } catch (error) {
      if (typeof error === "object" && error !== null && "response" in error &&
        (error as { response?: { status?: number } }).response?.status === 404) return null;
      throw error;
    }
  },
};

export function validateReservationFormAnswers(
  form: ReservationForm,
  answers: ReservationAnswers,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fieldIds = new Set<string>();
  for (const section of form.sections) {
    for (const field of section.fields) {
      if (fieldIds.has(field.id)) {
        errors[field.id] = "El identificador de esta pregunta está repetido.";
        continue;
      }
      fieldIds.add(field.id);
      const answer = answers[field.id];
      const isEmpty = answer === undefined || answer === null || answer === "" || (Array.isArray(answer) && answer.length === 0);
      if (field.required && (isEmpty || (field.type === "CHECKBOX" && answer !== true))) {
        errors[field.id] = "Esta respuesta es obligatoria.";
        continue;
      }
      if (isEmpty) continue;
      if (field.type === "SINGLE_SELECT" && (typeof answer !== "string" || !field.options.includes(answer))) {
        errors[field.id] = "Selecciona una de las opciones disponibles.";
      } else if (field.type === "MULTI_SELECT" && (!Array.isArray(answer) || answer.some((value) => !field.options.includes(value)))) {
        errors[field.id] = "Revisa las opciones seleccionadas.";
      } else if (field.type === "YES_NO" && typeof answer !== "boolean") {
        errors[field.id] = "Selecciona Sí o No.";
      } else if (field.type === "NUMBER" && (typeof answer !== "number" || !Number.isFinite(answer))) {
        errors[field.id] = "Escribe un número válido.";
      } else if (field.type === "NUMBER" && typeof answer === "number" &&
        ((field.minValue != null && answer < field.minValue) || (field.maxValue != null && answer > field.maxValue))) {
        errors[field.id] = "El número está fuera del rango permitido.";
      } else if (["SHORT_TEXT", "LONG_TEXT", "EMAIL", "PHONE", "DATE", "TIME"].includes(field.type) && typeof answer !== "string") {
        errors[field.id] = "Escribe una respuesta válida.";
      } else if (field.type === "EMAIL" && typeof answer === "string" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer)) {
        errors[field.id] = "Escribe un correo electrónico válido.";
      } else if (typeof answer === "string" &&
        ((field.minLength != null && answer.length < field.minLength) || (field.maxLength != null && answer.length > field.maxLength))) {
        errors[field.id] = "La respuesta está fuera de la longitud permitida.";
      }
    }
  }
  const knownIds = new Set(fieldIds);
  if (Object.keys(answers).some((fieldId) => !knownIds.has(fieldId))) {
    errors._form = "El formulario cambió. Actualiza la página e intenta nuevamente.";
  }
  return errors;
}