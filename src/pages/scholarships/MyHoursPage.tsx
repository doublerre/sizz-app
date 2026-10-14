import { useCallback, useState } from "react";
import { scholarshipService as api } from "../../services/scholarship.service";
import type { Grant } from "../../services/scholarship.types";
import { useApiResource } from "../../hooks/useApiResource";
import { money } from "../../data/scholarships";
import {
  LoadState,
  Notice,
  ScholarshipField,
  ScholarshipHeader,
} from "../../components/scholarships/ScholarshipUI";
import MonthlyHoursTable from "../../components/scholarships/MonthlyHoursTable";

function GrantHours({ grant }: { grant: Grant }) {
  const resource = useApiResource(
    useCallback(() => api.months(grant.id), [grant.id]),
  );
  const months = resource.data;
  return (
    <>
      <div className="sch-summary-grid">
        <div className="sch-card">
          <small>Horas base mensuales</small>
          <strong>{grant.monthlyHours} h</strong>
        </div>
        <div className="sch-card">
          <small>Apoyo mensual máximo</small>
          <strong>{money(grant.monthlyAmount)}</strong>
        </div>
        <div className="sch-card">
          <small>Duración de la beca</small>
          <strong>{grant.durationMonths} meses</strong>
        </div>
      </div>
      <section className="sch-card">
        <h2>Detalle mensual · {grant.categoryName}</h2>
        <LoadState {...resource} retry={resource.reload} />
        {months && <MonthlyHoursTable months={months} />}
      </section>
      <Notice>
        Estos montos son estimaciones. A partir del 80% de las horas base se
        calcula el apoyo proporcional, hasta el máximo de tu categoría.
      </Notice>
    </>
  );
}
export default function MyHoursPage() {
  const resource = useApiResource(api.myGrants);
  const [selected, setSelected] = useState("");
  const grant =
    resource.data?.find((grant) => grant.id === selected) ?? resource.data?.[0];
  return (
    <>
      <ScholarshipHeader
        title="Mis horas y becas"
        subtitle="Consulta tus horas registradas y el estimado mensual de tu beca."
      />
      <main className="sch-admin-content">
        <LoadState {...resource} retry={resource.reload} />
        {resource.data && resource.data.length > 0 && (
          <>
            <div className="sch-filter-row">
              <ScholarshipField label="Beca">
                <select
                  value={grant?.id ?? ""}
                  onChange={(e) => setSelected(e.target.value)}
                >
                  {resource.data.map((grant) => (
                    <option value={grant.id} key={grant.id}>
                      {grant.categoryName} · {grant.awardedAt.slice(0, 10)}
                    </option>
                  ))}
                </select>
              </ScholarshipField>
            </div>
            {grant && <GrantHours key={grant.id} grant={grant} />}
          </>
        )}
        {resource.data?.length === 0 && (
          <Notice>
            Aún no tienes una beca otorgada. El seguimiento de horas comienza
            después del otorgamiento.
          </Notice>
        )}
      </main>
    </>
  );
}
