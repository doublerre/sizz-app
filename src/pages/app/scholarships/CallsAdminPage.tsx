import { useState } from "react";
import { Link } from "react-router-dom";
import TableActions from "../../../components/scholarships/TableActions";
import { useAuth } from "../../../context/useAuth";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { useApiResource } from "../../../hooks/useApiResource";
import { dateLabel, money, statusLabels } from "../../../data/scholarships";
import {
  AdminScholarshipNav,
  LoadState,
  ScholarshipField,
  ScholarshipHeader,
  StatusBadge,
} from "../../../components/scholarships/ScholarshipUI";

export default function CallsAdminPage() {
  const { user } = useAuth();
  const resource = useApiResource(api.calls);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const calls =
    resource.data?.filter(
      (call) =>
        call.name.toLowerCase().includes(search.toLowerCase()) &&
        (!status || call.status === status),
    ) ?? [];
  const pages = Math.ceil(calls.length / 8);
  const current = Math.min(page, Math.max(pages, 1));
  return (
    <>
      <ScholarshipHeader
        title="Convocatorias para guías"
        subtitle="Crea modalidades, fechas y formularios sin programar."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav />
        <section className="sch-card sch-call-list">
          <div className="sch-section-heading">
            <h2>Convocatorias</h2>
            <Link
              className="sch-button sch-button-primary"
              to="/app/becas/nueva"
            >
              + Nueva convocatoria
            </Link>
          </div>
          <div className="sch-filter-row">
            <ScholarshipField label="Buscar">
              <input
                value={search}
                placeholder="Nombre de convocatoria"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </ScholarshipField>
            <ScholarshipField label="Estado">
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos los estados</option>
                {["DRAFT", "OPEN", "PAUSED", "CLOSED"].map((status) => (
                  <option value={status} key={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </ScholarshipField>
          </div>
          <LoadState {...resource} retry={resource.reload} />
          <div className="sch-table-wrap">
            <table className="sch-table sch-action-table">
              <thead>
                <tr>
                  <th>Convocatoria</th>
                  <th>Modalidades</th>
                  <th>Registro</th>
                  <th>Disponible</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {calls.slice((current - 1) * 8, current * 8).map((call) => (
                  <tr key={call.id}>
                    <td>
                      <strong>{call.name}</strong>
                    </td>
                    <td>{call.applicationTypes.length} modalidades</td>
                    <td>
                      {dateLabel(call.opensOn)}
                      <small>{dateLabel(call.closesOn)}</small>
                    </td>
                    <td>{money(call.availableBudget)}</td>
                    <td>
                      <StatusBadge status={call.status} />
                    </td>
                    <td>
                      <TableActions name={call.name}>
                        <Link to={`/app/becas/${call.id}/editar`}>
                          Configurar
                        </Link>
                        <Link to={`/app/becas/${call.id}/postulaciones`}>
                          Postulaciones
                        </Link>
                        {user?.role === "ADMIN" && (
                          <Link to={`/app/becas/${call.id}/horas`}>Horas</Link>
                        )}
                      </TableActions>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {resource.data && calls.length === 0 && (
            <p className="sch-empty">
              No hay convocatorias que coincidan con los filtros.
            </p>
          )}
          <footer className="sch-pagination">
            <span>{calls.length} convocatorias</span>
            <nav aria-label="Páginas">
              {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={page === current ? "active" : ""}
                  onClick={() => setPage(page)}
                >
                  {page}
                </button>
              ))}
            </nav>
          </footer>
        </section>
      </main>
    </>
  );
}
