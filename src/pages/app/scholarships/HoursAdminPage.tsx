import { useToast } from "../../../context/useToast";
import { useCallback, useState } from "react";
import { useParams } from "react-router-dom";
import type {
  DailyAttendance,
  Grant,
} from "../../../services/scholarship.types";
import { scholarshipService as api } from "../../../services/scholarship.service";
import { apiMessage, useApiResource } from "../../../hooks/useApiResource";
import { dateLabel, money } from "../../../data/scholarships";
import MonthlyHoursTable from "../../../components/scholarships/MonthlyHoursTable";
import {
  AdminScholarshipNav,
  LoadState,
  Notice,
  ScholarshipButton,
  ScholarshipField,
  ScholarshipHeader,
  StatusBadge,
} from "../../../components/scholarships/ScholarshipUI";

function IncidentForm({
  incident,
  onUpdate,
}: {
  incident: DailyAttendance;
  onUpdate: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [zero, setZero] = useState(false);
  async function submit(form: HTMLFormElement) {
    const data = new FormData(form);
    setBusy(true);
    try {
      await api.resolveIncident(
        incident.id,
        zero ? null : String(data.get("exitTime")),
        String(data.get("explanation")),
      );
      toast.success("Incidencia resuelta.");
      onUpdate();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="sch-builder-field"
      onSubmit={(e) => {
        e.preventDefault();
        void submit(e.currentTarget);
      }}
    >
      <strong>Incidencia · {dateLabel(incident.date)}</strong>
      <p>Entrada: {incident.firstPunch?.slice(11, 16) ?? "—"}</p>
      <div className="sch-fields">
        <ScholarshipField label="Hora de salida">
          <input
            name="exitTime"
            type="time"
            required={!zero}
            disabled={zero || busy}
          />
        </ScholarshipField>
        <ScholarshipField label="Explicación">
          <input name="explanation" required maxLength={1000} disabled={busy} />
        </ScholarshipField>
      </div>
      <label className="sch-checkbox">
        <input
          type="checkbox"
          checked={zero}
          onChange={(e) => setZero(e.target.checked)}
          disabled={busy}
        />
        Resolver dejando el día con cero horas
      </label>
      <div className="sch-actions">
        <ScholarshipButton type="submit" disabled={busy}>
          Resolver incidencia
        </ScholarshipButton>
      </div>
    </form>
  );
}
function GrantAdministration({ grant }: { grant: Grant }) {
  const months = useApiResource(
    useCallback(() => api.months(grant.id, true), [grant.id]),
  );
  const daily = useApiResource(
    useCallback(() => api.dailyAttendance(grant.id), [grant.id]),
  );
  const [month, setMonth] = useState(1);
  const [operation, setOperation] = useState("extra");
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  async function adjust(form: HTMLFormElement) {
    const hours = Number(new FormData(form).get("hours"));
    setBusy(true);
    try {
      if (operation === "clock") await api.recordHours(grant.id, month, hours);
      else if (operation === "extra")
        await api.extraHours(grant.id, month, hours);
      else await api.transferHours(grant.id, month, hours);
      form.reset();
      months.reload();
      toast.success("Registro de horas actualizado.");
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="sch-summary-grid">
        <div className="sch-card">
          <small>Horas base mensuales</small>
          <strong>{grant.monthlyHours} h</strong>
        </div>
        <div className="sch-card">
          <small>Monto mensual</small>
          <strong>{money(grant.monthlyAmount)}</strong>
        </div>
        <div className="sch-card">
          <small>Compromiso presupuestario</small>
          <strong>{money(grant.committedAmount)}</strong>
        </div>
      </div>
      <section className="sch-card">
        <h2>Horas y estimaciones mensuales</h2>
        <LoadState {...months} retry={months.reload} />
        {months.data && <MonthlyHoursTable months={months.data} />}
        <h3>Ajuste administrativo</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void adjust(e.currentTarget);
          }}
        >
          <div className="sch-fields">
            <ScholarshipField label="Mes de la beca">
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {Array.from(
                  { length: grant.durationMonths },
                  (_, i) => i + 1,
                ).map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </ScholarshipField>
            <ScholarshipField label="Operación">
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value)}
              >
                <option value="extra">Autorizar horas extra</option>
                <option value="clock">Actualizar horas del checador</option>
                <option value="transfer">
                  Transferir excedente al siguiente mes
                </option>
              </select>
            </ScholarshipField>
            <ScholarshipField label="Horas">
              <input
                name="hours"
                required
                type="number"
                min={operation === "clock" ? 0 : 0.01}
                step="0.01"
              />
            </ScholarshipField>
          </div>
          <Notice>
            {operation === "clock"
              ? "Este valor reemplaza las horas del checador del mes seleccionado."
              : operation === "extra"
                ? "Las horas extra se añaden al acumulado mensual."
                : "Solo se transfiere el excedente disponible al mes inmediato siguiente."}
          </Notice>
          <div className="sch-actions">
            <ScholarshipButton type="submit" disabled={busy}>
              Guardar ajuste
            </ScholarshipButton>
          </div>
        </form>
      </section>
      <section className="sch-card sch-stack">
        <h2>Registros del checador e incidencias</h2>
        <LoadState {...daily} retry={daily.reload} />
        {daily.data && (
          <>
            <div className="sch-table-wrap">
              <table className="sch-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Horas</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.data.map((day) => (
                    <tr key={day.id}>
                      <td>{dateLabel(day.date)}</td>
                      <td>{day.firstPunch?.slice(11, 16) ?? "—"}</td>
                      <td>{day.lastPunch?.slice(11, 16) ?? "—"}</td>
                      <td>{day.workedHours} h</td>
                      <td>
                        <StatusBadge status={day.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sch-form-builder">
              {daily.data
                .filter((day) => day.status === "INCIDENT")
                .map((day) => (
                  <IncidentForm
                    key={day.id}
                    incident={day}
                    onUpdate={() => {
                      daily.reload();
                      months.reload();
                    }}
                  />
                ))}
            </div>
            {daily.data.length === 0 && (
              <p className="sch-empty">
                No hay registros diarios para esta beca.
              </p>
            )}
          </>
        )}
      </section>
      <Notice>
        La K40 se sincroniza mediante el conector. Esta vista consulta registros
        y resuelve incidencias; los importes son estimaciones de beca.
      </Notice>
    </>
  );
}
export default function HoursAdminPage() {
  const { callId = "" } = useParams();
  const [selected, setSelected] = useState("");
  const resource = useApiResource(
    useCallback(async () => {
      const [grants, applicants] = await Promise.all([
        api.grants(callId),
        api.adminApplications(callId),
      ]);
      return { grants, applicants };
    }, [callId]),
  );
  const grant =
    resource.data?.grants.find((grant) => grant.id === selected) ??
    resource.data?.grants[0];
  return (
    <>
      <ScholarshipHeader
        title="Horas y becas"
        subtitle="Consulta el checador, valida incidencias y revisa el estimado mensual."
      />
      <main className="sch-admin-content">
        <AdminScholarshipNav callId={callId} />
        <LoadState {...resource} retry={resource.reload} />
        {resource.data && (
          <>
            {resource.data.grants.length ? (
              <>
                <div className="sch-filter-row">
                  <ScholarshipField label="Guía y beca">
                    <select
                      value={grant?.id ?? ""}
                      onChange={(e) => setSelected(e.target.value)}
                    >
                      {resource.data.grants.map((grant) => {
                        const row = resource.data?.applicants.find(
                          (row) => row.studentId === grant.studentId,
                        );
                        return (
                          <option value={grant.id} key={grant.id}>
                            {row
                              ? `${row.firstName} ${row.lastName}`
                              : grant.studentId}{" "}
                            · {grant.categoryName}
                          </option>
                        );
                      })}
                    </select>
                  </ScholarshipField>
                </div>
                {grant && <GrantAdministration key={grant.id} grant={grant} />}
              </>
            ) : (
              <Notice>No hay becas otorgadas para esta convocatoria.</Notice>
            )}
          </>
        )}
      </main>
    </>
  );
}
