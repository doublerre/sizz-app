import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../../../context/useToast";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../../hooks/useApiResource";
import type { ScholarshipForm } from "../../../services/scholarship.types";
import FormBuilder from "../../../components/scholarships/FormBuilder";
import TableActions from "../../../components/scholarships/TableActions";
import {
  AdminScholarshipNav,
  LoadState,
  Notice,
  ScholarshipHeader,
} from "../../../components/scholarships/ScholarshipUI";

export default function FormsAdminPage() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const resource = useApiResource(api.forms);
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function toggleActive(form: ScholarshipForm) {
    setBusy(true);
    try {
      await api.setFormActive(form.id, !form.active);
      resource.reload();
      toast.success(
        `${form.purpose === "EXAM" ? "Examen" : "Formulario"} ${form.active ? "deshabilitado" : "habilitado"}.`,
      );
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  const form = resource.data?.find((form) => form.id === formId);
  return (
    <>
      <ScholarshipHeader
        title="Formularios y exámenes"
        subtitle="Guarda tu avance como borrador y publica una versión cuando esté lista."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav />
        <LoadState {...resource} retry={resource.reload} />
        {resource.data &&
          (formId ? (
            formId === "nuevo" || form ? (
              <FormBuilder
                key={`${formId}-${form?.versions.length ?? 0}`}
                existing={form}
                onSave={() => {
                  resource.reload();
                  navigate("/app/becas/formularios");
                }}
              />
            ) : (
              <Notice error>Formulario no encontrado.</Notice>
            )
          ) : (
            <section className="sch-card">
              <div className="sch-section-heading">
                <h2>Biblioteca de formularios</h2>
                <Link
                  className="sch-button sch-button-primary"
                  to="/app/becas/formularios/nuevo"
                >
                  + Crear / continuar formulario
                </Link>
              </div>
              <div className="sch-table-wrap">
                <table className="sch-table sch-action-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Propósito</th>
                      <th>Versiones</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resource.data.map((form) => (
                      <tr key={form.id}>
                        <td>
                          <strong>{form.name}</strong>
                        </td>
                        <td>
                          {form.purpose === "EXAM" ? "Examen" : "Solicitud"}
                        </td>
                        <td>
                          {form.versions
                            .map((version) => `v${version.version}`)
                            .join(", ")}
                        </td>
                        <td>{form.active ? "Habilitado" : "Deshabilitado"}</td>
                        <td>
                          <TableActions name={form.name}>
                            <Link to={`/app/becas/formularios/${form.id}`}>
                              Preparar / continuar borrador
                            </Link>
                            <button
                              type="button"
                              disabled={busy || resource.loading}
                              onClick={() => void toggleActive(form)}
                            >
                              {form.active ? "Deshabilitar" : "Habilitar"}
                            </button>
                          </TableActions>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {resource.data.length === 0 && (
                <p className="sch-empty">
                  Crea un formulario para asignarlo a una convocatoria.
                </p>
              )}
            </section>
          ))}
      </main>
    </>
  );
}
