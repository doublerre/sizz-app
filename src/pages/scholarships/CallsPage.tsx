import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { scholarshipService as api } from "../../services/scholarship.service";
import { useApiResource } from "../../hooks/useApiResource";
import { applicationTypes, dateLabel } from "../../data/scholarships";
import {
  LoadState,
  Notice,
  ScholarshipField,
  StatusBadge,
} from "../../components/scholarships/ScholarshipUI";

export default function CallsPage() {
  const { isAuthenticated } = useAuth();
  const resource = useApiResource(
    useCallback(
      () => (isAuthenticated ? api.openCalls() : Promise.resolve([])),
      [isAuthenticated],
    ),
  );
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const calls = resource.data?.filter(
    (call) =>
      `${call.name} ${call.periodName}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!type || call.applicationType === type),
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
        <h2>Encuentra una modalidad</h2>
        <div className="sch-filter-row">
          <ScholarshipField label="Buscar">
            <input
              placeholder="Nombre de convocatoria o periodo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </ScholarshipField>
          <ScholarshipField label="Modalidad">
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Todas las modalidades</option>
              {Object.entries(applicationTypes).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </ScholarshipField>
          <Link className="sch-button sch-button-primary" to="/cuenta/becas">
            Mis postulaciones
          </Link>
        </div>
        <LoadState {...resource} retry={resource.reload} />
        {!isAuthenticated && (
          <Notice>
            Inicia sesión para consultar las convocatorias disponibles para tu
            historial.{" "}
            <Link to="/login" state={{ returnTo: "/becas" }}>
              Iniciar sesión
            </Link>
          </Notice>
        )}
        <div className="sch-grid">
          {calls?.map((call) => (
            <article className="sch-card sch-call-card" key={call.id}>
              <StatusBadge status="OPEN" />
              <h3>{call.name}</h3>
              <strong>{applicationTypes[call.applicationType]}</strong>
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
        {isAuthenticated && calls?.length === 0 && (
          <p className="sch-empty">
            No hay convocatorias disponibles que coincidan con los filtros.
          </p>
        )}
      </main>
    </>
  );
}
