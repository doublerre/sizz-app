import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { scholarshipService as api } from "../../services/scholarship.service";
import type { ApplicationType } from "../../services/scholarship.types";
import { useApiResource } from "../../hooks/useApiResource";
import { applicationTypes, dateLabel } from "../../data/scholarships";
import {
  LoadState,
  ScholarshipField,
  StatusBadge,
} from "../../components/scholarships/ScholarshipUI";

export default function CallsPage() {
  const { isAuthenticated } = useAuth();
  const resource = useApiResource(api.publicCalls);
  const [search, setSearch] = useState("");
  const [type, setType] = useState<ApplicationType | "">("");
  const calls = resource.data?.filter(
    (call) =>
      `${call.name} ${call.periodName}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!type || call.applicationTypes.includes(type)),
  );
  return (
    <>
      <section className="sch-hero">
        <p>BECAS PARA GUÍAS ZIGZAG</p>
        <h1>Convocatorias abiertas</h1>
        <p>
          Participa, aprende y acompaña a nuestros visitantes en experiencias de
          ciencia y tecnología.
        </p>
      </section>
      <main className="sch-public-content sch-calls-content">
        <h2>Encuentra una convocatoria</h2>
        <div className="sch-filter-row">
          <ScholarshipField label="Buscar">
            <input
              placeholder="Nombre de convocatoria o periodo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </ScholarshipField>
          <ScholarshipField label="Modalidad de la convocatoria">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ApplicationType | "")}
            >
              <option value="">Todas las modalidades</option>
              {Object.entries(applicationTypes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </ScholarshipField>
          {isAuthenticated && (
            <Link className="sch-button sch-button-primary" to="/cuenta/becas">
              Mis postulaciones
            </Link>
          )}
        </div>
        <LoadState {...resource} retry={resource.reload} />
        {resource.data && resource.data.length > 0 && (
          <p className="sch-muted">
            El filtro muestra las modalidades habilitadas en cada convocatoria.
            Tu modalidad de postulación se determina con tu historial del
            semestre anterior.
          </p>
        )}
        <div className="sch-grid">
          {calls?.map((call) => (
            <article className="sch-card sch-call-card" key={call.id}>
              <StatusBadge status="OPEN" />
              <h3>{call.name}</h3>
              <strong>
                {call.applicationTypes
                  .toSorted()
                  .map((type) => applicationTypes[type])
                  .join(" · ")}
              </strong>
              <p>
                {call.periodName} · {call.durationMonths} meses de beca
              </p>
              <p className="sch-close">Cierre: {dateLabel(call.closesOn)}</p>
              <Link
                className="sch-button sch-button-primary"
                to={`/becas/${call.id}`}
              >
                Ver convocatoria
              </Link>
            </article>
          ))}
        </div>
        {calls?.length === 0 && (
          <p className="sch-empty">
            No hay convocatorias disponibles que coincidan con los filtros.
          </p>
        )}
      </main>
    </>
  );
}
