import { useToast } from "../../context/useToast";
import { useState } from "react";
import type { ScholarshipApplication } from "../../services/scholarship.types";
import { scholarshipService as api } from "../../services/scholarship.service";
import { apiMessage } from "../../hooks/useApiResource";
import { saveBlob } from "../../data/scholarships";
import { validateFile } from "./dynamicForm";
import { Notice, ScholarshipButton, StatusBadge } from "./ScholarshipUI";

export default function DocumentFields({
  application,
  editable = false,
  admin = false,
  onUpdate,
}: {
  application: ScholarshipApplication;
  editable?: boolean;
  admin?: boolean;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState("");
  const [comments, setComments] = useState<Record<string, string>>({});
  async function download(fileId: string, name: string) {
    setBusy(fileId);
    try {
      saveBlob(await api.download(application.id, fileId), name);
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy("");
    }
  }
  async function review(fileId: string, approved: boolean) {
    const comment = comments[fileId] ?? "";
    if (!approved && !comment.trim()) {
      toast.error("Indica qué debe corregir el alumno.");
      return;
    }
    setBusy(fileId);
    try {
      await api.reviewFile(
        application.id,
        fileId,
        approved ? "APPROVED" : "REJECTED",
        comment,
      );
      toast.success(
        approved ? "Documento aprobado." : "Corrección solicitada.",
      );
      onUpdate();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="sch-documents">
      {application.form.fields
        .filter((field) => field.type === "FILE")
        .map((field) => {
          const file = application.files.find(
            (file) => file.fieldKey === field.key,
          );
          return (
            <article className="sch-document" key={field.key}>
              <div className="sch-section-heading">
                <strong>
                  {field.label}
                  {field.required ? " *" : ""}
                </strong>
                <StatusBadge status={file?.status ?? "PENDING"} />
              </div>
              <p>{field.helpText}</p>
              <small>
                {field.allowedFileTypes.join(" / ")} · Máximo{" "}
                {Math.round((field.maxFileBytes ?? 10485760) / 1048576)} MB
              </small>
              {file && (
                <>
                  <ScholarshipButton
                    tone="secondary"
                    disabled={!!busy}
                    onClick={() => download(file.id, file.originalName)}
                  >
                    {file.originalName}
                  </ScholarshipButton>
                  {file.reviewComment && (
                    <Notice error={file.status === "REJECTED"}>
                      {file.reviewComment}
                    </Notice>
                  )}
                </>
              )}
              {editable && (
                <label className="sch-field">
                  <span>
                    {file ? "Reemplazar documento" : "Cargar documento"}
                  </span>
                  <input
                    type="file"
                    disabled={!!busy}
                    accept={field.allowedFileTypes
                      .map((type) =>
                        type === "PDF"
                          ? "application/pdf"
                          : "image/jpeg,image/png",
                      )
                      .join(",")}
                    onChange={async (e) => {
                      const input = e.currentTarget;
                      const selected = input.files?.[0];
                      if (!selected) return;
                      const validation = validateFile(field, selected);
                      if (validation) {
                        toast.error(validation);
                        input.value = "";
                        return;
                      }
                      setBusy(field.key);
                      try {
                        await api.upload(application.id, field.key, selected);
                        toast.success("Documento cargado.");
                        onUpdate();
                      } catch (error) {
                        toast.error(apiMessage(error));
                      } finally {
                        setBusy("");
                        input.value = "";
                      }
                    }}
                  />
                </label>
              )}
              {admin && file && (
                <>
                  <label className="sch-field">
                    <span>Observaciones</span>
                    <textarea
                      maxLength={1000}
                      value={comments[file.id] ?? ""}
                      onChange={(e) =>
                        setComments({ ...comments, [file.id]: e.target.value })
                      }
                    />
                  </label>
                  <div className="sch-actions">
                    <ScholarshipButton
                      tone="danger"
                      disabled={!!busy}
                      onClick={() => review(file.id, false)}
                    >
                      Solicitar corrección
                    </ScholarshipButton>
                    <ScholarshipButton
                      tone="success"
                      disabled={!!busy}
                      onClick={() => review(file.id, true)}
                    >
                      Aprobar documento
                    </ScholarshipButton>
                  </div>
                </>
              )}
            </article>
          );
        })}
      {busy && <Notice>Procesando documento…</Notice>}
      {!application.form.fields.some((field) => field.type === "FILE") && (
        <p>Este formulario no solicita documentos.</p>
      )}
    </div>
  );
}
