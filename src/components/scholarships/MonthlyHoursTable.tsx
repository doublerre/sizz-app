import type { MonthlyHours } from "../../services/scholarship.types";
import { money } from "../../data/scholarships";
import { StatusBadge } from "./ScholarshipUI";

export default function MonthlyHoursTable({
  months,
}: {
  months: MonthlyHours[];
}) {
  return (
    <div className="sch-table-wrap">
      <table className="sch-table">
        <thead>
          <tr>
            <th>Mes</th>
            <th>Checador</th>
            <th>Extras</th>
            <th>Crédito</th>
            <th>Acumuladas</th>
            <th>Faltantes</th>
            <th>Estimado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.monthNumber}>
              <td>
                <strong>{month.monthNumber}</strong>
              </td>
              <td>{month.clockHours} h</td>
              <td>{month.extraHours} h</td>
              <td>{month.carriedInHours} h</td>
              <td>
                <strong>{month.creditedHours} h</strong>
                <small>
                  Base: {month.monthlyHours} h · Mínimo: {month.minimumHours} h
                </small>
              </td>
              <td>{month.remainingHours} h</td>
              <td>
                <strong>{money(month.estimatedAmount)}</strong>
              </td>
              <td>
                <StatusBadge
                  status={month.eligible ? "ELIGIBLE" : "INELIGIBLE"}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {months.length === 0 && (
        <p className="sch-empty">Todavía no hay horas registradas.</p>
      )}
    </div>
  );
}
