import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { useApiResource } from "../../../hooks/useApiResource";
import { applicationTypes, statusLabels } from "../../../data/scholarships";
import { displayAnswer } from "../../../components/scholarships/dynamicForm";
import DocumentFields from "../../../components/scholarships/DocumentFields";
import {
  AdminScholarshipNav,
  LoadState,
  Notice,
  ScholarshipField,
  ScholarshipHeader,
  StatusBadge,
} from "../../../components/scholarships/ScholarshipUI";

export default function ApplicationsAdminPage() {
  const { callId = "" } = useParams();
  const resource = useApiResource(
    useCallback(() => api.adminApplications(callId), [callId]),
  );
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const applicants = resource.data?.filter(
    (row) =>
      `${row.firstName} ${row.lastName} ${row.email} ${row.application.id}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!status || row.application.status === status),
  );
  const selected =
    applicants?.find((row) => row.application.id === selectedId) ??
    applicants?.[0];
  return (
    <>
      <ScholarshipHeader
        title="Postulaciones"
        subtitle="Revisa respuestas y documentos de las solicitudes recibidas."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav callId={callId} />
        <LoadState {...resource} retry={resource.reload} />
        <div className="sch-two-columns">
          <section className="sch-card">
            <h2>Postulaciones recibidas</h2>
            <div className="sch-filter-row">
              <ScholarshipField label="Buscar">
                <input
                  placeholder="Nombre, identificador o correo"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </ScholarshipField>
              <ScholarshipField label="Estado">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {[
                    "DRAFT",
                    "SUBMITTED",
                    "DOCUMENTS_INCOMPLETE",
                    "VALIDATED",
                    "REJECTED",
                    "AWARDED",
                  ].map((status) => (
                    <option value={status} key={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </ScholarshipField>
            </div>
            <div className="sch-applications-list">
              {applicants?.map((row) => (
                <button
                  key={row.application.id}
                  className={`sch-applicant ${selected?.application.id === row.application.id ? "active" : ""}`}
                  onClick={() => setSelectedId(row.application.id)}
                >
                  <span className="sch-avatar">
                    {row.firstName.slice(0, 1)}
                  </span>
                  <div>
                    <strong>
                      {row.firstName} {row.lastName}
                    </strong>
                    <small>{row.email}</small>
                  </div>
                  <StatusBadge status={row.application.status} />
                </button>
              ))}
            </div>
            {applicants?.length === 0 && (
              <p className="sch-empty">
                No hay postulaciones que coincidan con los filtros.
              </p>
            )}
          </section>
          <aside className="sch-card">
            {selected ? (
              <>
                <StatusBadge status={selected.application.status} />
                <h2>
                  {selected.firstName} {selected.lastName}
                </h2>
                <p>
                  {applicationTypes[selected.application.applicationType]} ·{" "}
                  {selected.email}
                </p>
                <div className="sch-divider" />
                <h3>Datos principales</h3>
                <dl>
                  {selected.application.form.fields
                    .filter((field) => field.type !== "FILE")
                    .map((field) => (
                      <div className="sch-review-answer" key={field.key}>
                        <dt>{field.label}</dt>
                        <dd>
                          {displayAnswer(
                            selected.application.answers[field.key],
                            field,
                          )}
                        </dd>
                      </div>
                    ))}
                </dl>
                <h3>Documentos</h3>
                <DocumentFields
                  key={selected.application.id}
                  application={selected.application}
                  admin={
                    !resource.loading &&
                    ["SUBMITTED", "DOCUMENTS_INCOMPLETE", "VALIDATED"].includes(
                      selected.application.status,
                    )
                  }
                  onUpdate={resource.reload}
                />
                <Notice>
                  La aprobación de documentos valida la solicitud. El
                  otorgamiento se realiza desde Evaluación, después de cerrar la
                  convocatoria.
                </Notice>
              </>
            ) : (
              <p className="sch-empty">Selecciona una postulación.</p>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
