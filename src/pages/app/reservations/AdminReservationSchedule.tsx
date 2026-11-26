import { useCallback, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw } from "lucide-react";
import DateInput from "@/components/DateInput";
import { useToast } from "@/context/useToast";
import { useApiResource } from "@/hooks/useApiResource";
import { reservationsService, type ScheduleTemplateRequest, type TimeSlotStatus, type TimeSlotHistoryResponse } from "@/services/reservations.service";
import "./reservations.css";

const weekdayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const slotStatusLabels: Record<TimeSlotStatus, string> = {
  AVAILABLE: "Disponible",
  CLOSED: "Cerrado",
  FULL: "Sin cupo",
};

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}

function localTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value;
}

export default function AdminReservationSchedule() {
  const toast = useToast();
  const [activityFilter, setActivityFilter] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [fromDate, setFromDate] = useState(dateOffset(0));
  const [toDate, setToDate] = useState(dateOffset(30));
  const [templateId, setTemplateId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [maxCapacity, setMaxCapacity] = useState(30);
  const [saving, setSaving] = useState(false);
  const [exceptionActivityId, setExceptionActivityId] = useState("");
  const [exceptionDate, setExceptionDate] = useState(dateOffset(1));
  const [exceptionStart, setExceptionStart] = useState("09:00");
  const [exceptionEnd, setExceptionEnd] = useState("10:00");
  const [exceptionCapacity, setExceptionCapacity] = useState(30);
  const [closureActivityId, setClosureActivityId] = useState("");
  const [closureFrom, setClosureFrom] = useState(dateOffset(1));
  const [closureTo, setClosureTo] = useState(dateOffset(1));
  const [closureReason, setClosureReason] = useState("");
  const [slotToEdit, setSlotToEdit] = useState("");
  const [slotStart, setSlotStart] = useState("");
  const [slotEnd, setSlotEnd] = useState("");
  const [slotCapacity, setSlotCapacity] = useState(1);
  const [slotReason, setSlotReason] = useState("");
  const [historySlot, setHistorySlot] = useState("");
  const [slotHistory, setSlotHistory] = useState<TimeSlotHistoryResponse[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadActivities = useCallback(() => reservationsService.getActivities(), []);
  const { data: activities } = useApiResource(loadActivities);
  const loadTemplates = useCallback(
    () => activityFilter
      ? reservationsService.getScheduleTemplatesByActivity(activityFilter)
      : reservationsService.getScheduleTemplates(),
    [activityFilter],
  );
  const { data: templates, loading: templatesLoading, error: templatesError, reload: reloadTemplates } = useApiResource(loadTemplates);
  const loadSlots = useCallback(() => {
    if (!fromDate || !toDate || fromDate > toDate) return Promise.resolve([]);
    return reservationsService.getTimeSlots(fromDate, toDate, activityFilter || undefined);
  }, [activityFilter, fromDate, toDate]);
  const { data: slots, loading: slotsLoading, error: slotsError, reload: reloadSlots } = useApiResource(loadSlots);

  const resetTemplateForm = () => {
    setTemplateId("");
    setActivityId("");
    setDayOfWeek(1);
    setStartTime("09:00");
    setEndTime("10:00");
    setMaxCapacity(30);
  };

  const editTemplate = async (id: string) => {
    try {
      const template = await reservationsService.getScheduleTemplate(id);
      setTemplateId(template.id);
      setActivityId(template.activityId ?? "");
      setDayOfWeek(template.dayOfWeek);
      setStartTime(template.startTime.slice(0, 5));
      setEndTime(template.endTime.slice(0, 5));
      setMaxCapacity(template.maxCapacity);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la plantilla.");
    }
  };

  const saveTemplate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activityId) {
      toast.error("Selecciona una actividad.");
      return;
    }
    if (startTime >= endTime) {
      toast.error("La hora de fin debe ser posterior a la hora de inicio.");
      return;
    }
    setSaving(true);
    const request: ScheduleTemplateRequest = {
      activityId,
      dayOfWeek,
      startTime: localTime(startTime),
      endTime: localTime(endTime),
      maxCapacity,
      ...(templateId ? {} : { active: true }),
    };
    try {
      if (templateId) await reservationsService.updateScheduleTemplate(templateId, request);
      else await reservationsService.createScheduleTemplate(request);
      toast.success(templateId ? "Plantilla actualizada." : "Plantilla creada.");
      resetTemplateForm();
      reloadTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const deactivateTemplate = async (id: string) => {
    if (!window.confirm("¿Desactivar esta plantilla? Las franjas ya creadas no se eliminarán.")) return;
    try {
      await reservationsService.deactivateScheduleTemplate(id);
      toast.success("Plantilla desactivada.");
      if (templateId === id) resetTemplateForm();
      reloadTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo desactivar la plantilla.");
    }
  };

  const generateSlots = async () => {
    if (fromDate > toDate) {
      toast.error("La fecha final debe ser igual o posterior a la inicial.");
      return;
    }
    const selected = templates?.find((template) => template.id === selectedTemplateId);
    if (!selected) {
      toast.error("Selecciona una plantilla activa para generar franjas.");
      return;
    }
    try {
      const generated = await reservationsService.generateSlots(selected.id, { fromDate, toDate });
      toast.success(`Se generaron ${generated.length} franjas nuevas.`);
      reloadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron generar las franjas.");
    }
  };

  const changeSlotStatus = async (id: string, status: TimeSlotStatus) => {
    const reason = window.prompt("Motivo del cambio de estado (máximo 500 caracteres):");
    if (reason === null) return;
    try {
      await reservationsService.updateTimeSlotStatus(id, status, reason);
      toast.success("Estado de la franja actualizado.");
      reloadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la franja.");
    }
  };

  const createException = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!exceptionActivityId || exceptionStart >= exceptionEnd) {
      toast.error("Selecciona una actividad y un horario válido.");
      return;
    }
    setSaving(true);
    try {
      await reservationsService.createTimeSlotException({
        activityId: exceptionActivityId,
        slotDate: exceptionDate,
        startTime: localTime(exceptionStart),
        endTime: localTime(exceptionEnd),
        maxCapacity: exceptionCapacity,
      });
      toast.success("Se creó la franja extraordinaria.");
      reloadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la franja extraordinaria.");
    } finally {
      setSaving(false);
    }
  };

  const closeRange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!closureActivityId || closureFrom > closureTo) {
      toast.error("Selecciona una actividad y un rango de fechas válido.");
      return;
    }
    setSaving(true);
    try {
      const closed = await reservationsService.closeTimeSlots({
        activityId: closureActivityId,
        fromDate: closureFrom,
        toDate: closureTo,
        reason: closureReason.trim(),
      });
      toast.success(`Se cerraron ${closed.length} franjas.`);
      setClosureReason("");
      reloadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cerrar el rango.");
    } finally {
      setSaving(false);
    }
  };

  const editSlot = (slot: NonNullable<typeof slots>[number]) => {
    setSlotToEdit(slot.slotId);
    setSlotStart(slot.startTime.slice(0, 5));
    setSlotEnd(slot.endTime.slice(0, 5));
    setSlotCapacity(slot.maxCapacity);
    setSlotReason("");
  };

  const saveSlot = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const original = slots?.find((slot) => slot.slotId === slotToEdit);
    if (!slotToEdit || !original || slotStart >= slotEnd) {
      toast.error("El horario de fin debe ser posterior al inicio.");
      return;
    }
    if (localTime(slotStart) === original.startTime && localTime(slotEnd) === original.endTime && slotCapacity === original.maxCapacity) {
      toast.info("No hay cambios para guardar.");
      return;
    }
    setSaving(true);
    try {
      await reservationsService.updateTimeSlot(slotToEdit, {
        startTime: localTime(slotStart),
        endTime: localTime(slotEnd),
        maxCapacity: slotCapacity,
        reason: slotReason.trim() || undefined,
      });
      toast.success("La franja se actualizó.");
      setSlotToEdit("");
      reloadSlots();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la franja.");
    } finally {
      setSaving(false);
    }
  };

  const showSlotHistory = async (slotId: string) => {
    setHistorySlot(slotId);
    setHistoryLoading(true);
    try {
      setSlotHistory(await reservationsService.getTimeSlotHistory(slotId));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el historial de la franja.");
    } finally {
      setHistoryLoading(false);
    }
  };


  return (
    <div className="res-page">
      <header className="res-head">
        <div className="res-head__text">
          <h1 className="res-head__title">Agenda de reservaciones</h1>
          <p className="res-head__subtitle">Configura plantillas y administra las franjas del calendario.</p>
        </div>
        <div className="res-head__actions">
          <Link className="res-btn-secondary" to="/app/reservaciones"><ArrowLeft size={16} /> Reservaciones</Link>
        </div>
      </header>

      <div className="res-content res-schedule-layout">
        <section className="res-card">
          <h2 className="res-detail-section-title">Plantilla semanal</h2>
          <form className="res-schedule-form" onSubmit={saveTemplate}>
            <label>Actividad
              <select value={activityId} required onChange={(event) => setActivityId(event.target.value)}>
                <option value="">Selecciona actividad</option>
                {(activities ?? []).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
              </select>
            </label>
            <label>Día de semana (ISO)
              <select value={dayOfWeek} onChange={(event) => setDayOfWeek(Number(event.target.value))}>
                {weekdayNames.map((day, index) => <option key={day} value={index + 1}>{day}</option>)}
              </select>
            </label>
            <label>Hora de inicio<input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
            <label>Hora de fin<input type="time" required value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
            <label>Cupo máximo<input type="number" min={1} step={1} required value={maxCapacity} onChange={(event) => setMaxCapacity(Number(event.target.value))} /></label>
            <div className="res-schedule-actions">
              <button className="res-btn-primary" type="submit" disabled={saving}>{saving ? "Guardando…" : templateId ? "Actualizar plantilla" : "Crear plantilla"}</button>
              {templateId && <button className="res-btn-secondary" type="button" onClick={resetTemplateForm}>Cancelar edición</button>}
            </div>
          </form>

          <div className="res-schedule-list-header">
            <h3>Plantillas activas</h3>
            <button type="button" className="res-btn-secondary" onClick={reloadTemplates} aria-label="Actualizar plantillas"><RefreshCw size={14} /></button>
          </div>
          {templatesLoading && <p>Cargando plantillas…</p>}
          {templatesError && <p className="res-empty" role="alert">{templatesError}</p>}
          {templates?.map((template) => (
            <article className="res-template-row" key={template.id}>
              <div><strong>{template.activityName ?? "Actividad"} · {weekdayNames[template.dayOfWeek - 1] ?? `Día ${template.dayOfWeek}`}</strong><span>{template.startTime.slice(0, 5)}–{template.endTime.slice(0, 5)} · cupo {template.maxCapacity}</span></div>
              <div className="res-template-actions">
                <button type="button" className="res-btn-secondary" onClick={() => { setSelectedTemplateId(template.id); void editTemplate(template.id); }}>Editar</button>
                <button type="button" className="res-btn-secondary" onClick={() => void deactivateTemplate(template.id)}>Desactivar</button>
              </div>
            </article>
          ))}
          {!templatesLoading && !templatesError && templates?.length === 0 && <p>No hay plantillas activas.</p>}
        </section>

        <section className="res-card">
          <h2 className="res-detail-section-title">Generar y administrar franjas</h2>
          <div className="res-schedule-generation">
            <label>Plantilla
              <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                <option value="">Selecciona plantilla</option>
                {(templates ?? []).map((template) => <option key={template.id} value={template.id}>{template.activityName} · {weekdayNames[template.dayOfWeek - 1]}</option>)}
              </select>
            </label>
            <label>Desde<DateInput className="res-schedule-date" aria-label="Fecha inicial para generar franjas" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label>
            <label>Hasta<DateInput className="res-schedule-date" aria-label="Fecha final para generar franjas" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label>
            <button type="button" className="res-btn-primary" onClick={() => void generateSlots()} disabled={!selectedTemplateId || !fromDate || !toDate}>Generar franjas</button>
          </div>

          <h3 className="res-detail-section-title">Disponibilidad extraordinaria</h3>
          <form className="res-schedule-form" onSubmit={createException}>
            <label>Actividad<select required value={exceptionActivityId} onChange={(event) => setExceptionActivityId(event.target.value)}>
              <option value="">Selecciona actividad</option>
              {(activities ?? []).filter((activity) => activity.active && activity.isReservable).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </select></label>
            <label>Fecha<DateInput required value={exceptionDate} min={dateOffset(1)} onChange={(event) => setExceptionDate(event.target.value)} /></label>
            <label>Inicio<input type="time" required value={exceptionStart} onChange={(event) => setExceptionStart(event.target.value)} /></label>
            <label>Fin<input type="time" required value={exceptionEnd} onChange={(event) => setExceptionEnd(event.target.value)} /></label>
            <label>Cupo<input type="number" min={1} required value={exceptionCapacity} onChange={(event) => setExceptionCapacity(Number(event.target.value))} /></label>
            <button type="submit" className="res-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Crear excepción"}</button>
          </form>

          <h3 className="res-detail-section-title">Cierre de rango</h3>
          <form className="res-schedule-form" onSubmit={closeRange}>
            <label>Actividad<select required value={closureActivityId} onChange={(event) => setClosureActivityId(event.target.value)}>
              <option value="">Selecciona actividad</option>
              {(activities ?? []).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
            </select></label>
            <label>Desde<DateInput required value={closureFrom} onChange={(event) => setClosureFrom(event.target.value)} /></label>
            <label>Hasta<DateInput required value={closureTo} onChange={(event) => setClosureTo(event.target.value)} /></label>
            <label>Motivo<input required maxLength={500} value={closureReason} onChange={(event) => setClosureReason(event.target.value)} /></label>
            <button type="submit" className="res-btn-secondary" disabled={saving}>{saving ? "Guardando…" : "Cerrar franjas"}</button>
          </form>

          <div className="res-schedule-generation res-schedule-filters">
            <label>Filtrar por actividad
              <select value={activityFilter} onChange={(event) => { setActivityFilter(event.target.value); setSelectedTemplateId(""); }}>
                <option value="">Todas</option>
                {(activities ?? []).map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
              </select>
            </label>
            <button type="button" className="res-btn-secondary" onClick={() => { reloadSlots(); reloadTemplates(); }}><RefreshCw size={14} /> Actualizar agenda</button>
          </div>

          {fromDate > toDate && <p className="res-empty" role="alert">El rango de fechas no es válido.</p>}
          {slotsLoading && <p>Cargando franjas…</p>}
          {slotsError && <p className="res-empty" role="alert">{slotsError}</p>}
          <div className="res-table-wrap">
            <table className="res-table">
              <thead><tr><th>Fecha</th><th>Horario</th><th>Actividad</th><th>Cupo</th><th>Estado</th><th>Acción</th></tr></thead>
              <tbody>
                {(slots ?? []).map((slot) => <tr key={slot.slotId}>
                  <td>{slot.slotDate}</td>
                  <td>{slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)}</td>
                  <td>{slot.activityName ?? "—"}</td>
                  <td>{slot.reservedCount}/{slot.maxCapacity} ({slot.slotsLeft} libres)</td>
                  <td>{slotStatusLabels[slot.status]}</td>
                  <td><select aria-label={`Cambiar estado de franja ${slot.slotDate} ${slot.startTime}`} value={slot.status} onChange={(event) => void changeSlotStatus(slot.slotId, event.target.value as TimeSlotStatus)}>
                    {Object.entries(slotStatusLabels).filter(([status]) => status !== "FULL" || slot.reservedCount >= slot.maxCapacity).filter(([status]) => status !== "CLOSED" || slot.reservedCount === 0).filter(([status]) => status !== "AVAILABLE" || slot.slotsLeft > 0).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                  </select>
                    <button type="button" className="res-btn-secondary" onClick={() => editSlot(slot)}>Editar</button>
                    <button type="button" className="res-btn-secondary" onClick={() => void showSlotHistory(slot.slotId)}>Historial</button>
                  </td>
                </tr>)}
              </tbody>
            </table>
          </div>
          {slotToEdit && <form className="res-schedule-form" onSubmit={saveSlot}>
            <h3 className="res-detail-section-title">Editar franja</h3>
            <label>Inicio<input type="time" required value={slotStart} onChange={(event) => setSlotStart(event.target.value)} /></label>
            <label>Fin<input type="time" required value={slotEnd} onChange={(event) => setSlotEnd(event.target.value)} /></label>
            <label>Cupo<input type="number" min={slots?.find((slot) => slot.slotId === slotToEdit)?.reservedCount ?? 0} required value={slotCapacity} onChange={(event) => setSlotCapacity(Number(event.target.value))} /></label>
            <label>Motivo<input maxLength={500} value={slotReason} onChange={(event) => setSlotReason(event.target.value)} /></label>
            <button type="submit" className="res-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar franja"}</button>
            <button type="button" className="res-btn-secondary" onClick={() => setSlotToEdit("")}>Cancelar</button>
          </form>}
          {historySlot && <section className="res-history">
            <h3>Historial de franja</h3>
            <button type="button" className="res-btn-secondary" onClick={() => setHistorySlot("")}>Cerrar historial</button>
            {historyLoading ? <p>Cargando historial…</p> : slotHistory.length === 0 ? <p>Sin cambios registrados.</p> : <ul>{slotHistory.map((entry) => <li key={entry.id}>
              <strong>{entry.action}</strong>
              <span>{new Date(entry.createdAt).toLocaleString("es-MX")}</span>
              {entry.reason && <small>{entry.reason}</small>}
              {entry.changesJson && <small>{entry.changesJson}</small>}
            </li>)}</ul>}
          </section>}
          {!slotsLoading && !slotsError && slots?.length === 0 && <p>No hay franjas en el rango seleccionado.</p>}
        </section>
      </div>
    </div>
  );
}