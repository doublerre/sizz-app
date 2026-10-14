import type {
  FormField,
  ScholarshipForm,
} from "../../services/scholarship.types.ts";

export interface FormDraft {
  name: string;
  purpose: ScholarshipForm["purpose"];
  fields: FormField[];
}

export function formDraftKey(userId: string, formId: string) {
  return `sizz-form-draft:${userId}:${formId}`;
}

// shortcut: drafts live in this browser; add API storage for cross-device editing.
export function readFormDraft(
  storage: Pick<Storage, "getItem">,
  key: string,
): FormDraft | null {
  const stored = storage.getItem(key);
  if (!stored) return null;
  const draft = JSON.parse(stored) as FormDraft;
  if (
    typeof draft.name !== "string" ||
    !["APPLICATION", "EXAM"].includes(draft.purpose) ||
    !Array.isArray(draft.fields) ||
    draft.fields.some(
      (field) =>
        !field ||
        typeof field.key !== "string" ||
        typeof field.label !== "string" ||
        !Array.isArray(field.options) ||
        !Array.isArray(field.allowedFileTypes),
    )
  ) {
    throw new Error(
      "No se pudo leer el borrador guardado. No se ha eliminado.",
    );
  }
  return draft;
}
