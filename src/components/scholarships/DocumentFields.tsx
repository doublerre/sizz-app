import { useToast } from "../../context/useToast";
import { useState } from "react";
import type { ScholarshipApplication } from "../../services/scholarship.types";
import { scholarshipService as api } from "../../services/scholarship.service";
import { apiMessage } from "../../hooks/useApiResource";
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

  async function viewFile(fileId: string) {
    setBusy(fileId);
    try {
      const blob = await api.download(application.id, fileId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
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
          const fieldFiles = application.files.filter(
            (file) => file.fieldKey === field.key,
          );
          return (
            <article className="sch-document" key={field.key}>
              <div className="sch-section-heading">
                <strong>
                  {field.label}
                  {field.required ? " *" : ""}
                </strong>
                <StatusBadge
                  status={
                    fieldFiles.length === 0
                      ? "PENDING"
                      : fieldFiles.some((f) => f.status === "REJECTED")
                        ? "REJECTED"
                        : fieldFiles.every((f) => f.status === "APPROVED")
                          ? "APPROVED"
                          : "PENDING"
                  }
                />
              </div>
              <p>{field.helpText}</p>
              <small>
                {field.allowedFileTypes.join(" / ")} · Máximo{" "}
                {Math.round((field.maxFileBytes ?? 10485760) / 1048576)} MB por archivo
              </small>

              {fieldFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                  {fieldFiles.map((file) => (
                    <div key={file.id} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.75rem" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <ScholarshipButton
                            tone="secondary"
                            disabled={!!busy}
                            onClick={() => viewFile(file.id)}
                            title="Abrir para visualización directa"
                          >
                            👁️ {file.originalName}
                          </ScholarshipButton>
                          <StatusBadge status={file.status} />
                        </div>
                      </div>

                      {file.reviewComment && (
                        <Notice error={file.status === "REJECTED"}>
                          {file.reviewComment}
                        </Notice>
                      )}

                      {admin && (
                        <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px dashed #cbd5e1" }}>
                          <label className="sch-field">
                            <span>Observaciones ({file.originalName})</span>
                            <textarea
                              maxLength={1000}
                              value={comments[file.id] ?? ""}
                              onChange={(e) =>
                                setComments({ ...comments, [file.id]: e.target.value })
                              }
                            />
                          </label>
                          <div className="sch-actions" style={{ marginTop: "0.5rem" }}>
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {editable && (
                <label className="sch-field" style={{ marginTop: "0.75rem" }}>
                  <span>
                    {fieldFiles.length > 0 ? "Reemplazar documento" : "Cargar documento"}
                  </span>
                  <input
                    type="file"
                    disabled={!!busy}
                    accept={field.allowedFileTypes
                      .map((type) =>
                        type === "PDF"
                          ? "application/pdf"
                          : "image/jpeg,image/png,image/gif,image/webp",
                      )
                      .join(",")}
                    onChange={async (e) => {
                      const input = e.currentTarget;
                      const selectedFile = input.files?.[0];
                      if (!selectedFile) return;
                      const validation = validateFile(field, selectedFile);
                      if (validation) {
                        toast.error(`${selectedFile.name}: ${validation}`);
                        input.value = "";
                        return;
                      }
                      setBusy(field.key);
                      try {
                        await api.upload(application.id, field.key, selectedFile);
                        toast.success("Documento cargado o reemplazado.");
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
