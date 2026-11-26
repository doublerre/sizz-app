import { useCallback, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DateInput from "@/components/DateInput";
import { useAuth } from "@/context/useAuth";
import { useToast } from "@/context/useToast";
import { apiMessage, useApiResource } from "@/hooks/useApiResource";
import { reservationFormsService } from "@/services/reservation-forms.service";
import { reservationsService, type ReservationStatus } from "@/services/reservations.service";
import { dateLabel, reservationStatusLabels } from "./reservations.data";
import "./reservations.css";

function StatusBadge({ status }: { status: ReservationStatus }) {
  const classNames: Record<ReservationStatus, string> = {
    PENDING: "res-status--pending",
    PENDING_VALIDATION: "res-status--in-review",
    CONFIRMED: "res-status--approved",
    ATTENDED: "res-status--approved",
    CANCELLED: "res-status--rejected",
    NO_SHOW: "res-status--rejected",
  };
  return <span className={`res-status ${classNames[status]}`}>{reservationStatusLabels[status]}</span>;
}

export default function AdminReservationDetailPage({
  readOnly = false,
  backPath = "/app/reservaciones",
}: {
  readOnly?: boolean;
  backPath?: string;
}) {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const loadReservation = useCallback(() => {
    if (!id) return Promise.reject(new Error("No se especificó la reservación."));
    return reservationsService.getReservation(id);
  }, [id]);
  const { data: detail, loading, error, reload } = useApiResource(loadReservation);
  const loadHistory = useCallback(() => id ? reservationsService.getReservationHistory(id) : Promise.resolve([]), [id]);
  const { data: history, loading: historyLoading, reload: reloadHistory } = useApiResource(loadHistory);
  const loadAnswers = useCallback(() => id ? reservationsService.getReservationAnswers(id) : Promise.resolve(null), [id]);
  const { data: answerResponse, loading: answersLoading } = useApiResource(loadAnswers);
  const loadForms = useCallback(() => user?.role === "ADMIN" ? reservationFormsService.list() : Promise.resolve([]), [user?.role]);
  const { data: adminForms } = useApiResource(loadForms);
  const loadNotifications = useCallback(() => {
    if (!id) return Promise.resolve([]);
    if (user?.role === "ADMIN") return reservationsService.getAdminReservationNotifications(id);
    if (readOnly || user?.role === "SCHOLARSHIP_MANAGER" || user?.role === "REPORT") {
      return reservationsService.getReservationNotifications(id);
    }
    return Promise.resolve([]);
  }, [id, readOnly, user?.role]);
  const { data: notifications, loading: notificationsLoading, reload: reloadNotifications } = useApiResource(loadNotifications);
  const [nextStatus, setNextStatus] = useState<ReservationStatus | "">("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [ownerReason, setOwnerReason] = useState("");
  const [editing, setEditing] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [institution, setInstitution] = useState("");
  const [notes, setNotes] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const loadRescheduleSlots = useCallback(() => {
    if (!readOnly || !rescheduling || !detail || !rescheduleDate) return Promise.resolve([]);
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return reservationsService.getTimeSlots(rescheduleDate, rescheduleDate).then((slots) =>
      slots.filter((slot) => slot.status === "AVAILABLE" && slot.slotsLeft > 0 && slot.activityName === detail.activityName &&
        (slot.slotDate > currentDate || slot.slotDate === currentDate && slot.startTime.slice(0, 5) > currentTime)),
    );
  }, [detail, readOnly, rescheduleDate, rescheduling]);
  const { data: availableRescheduleSlots, loading: slotsLoading } = useApiResource(loadRescheduleSlots);
  const rescheduleSlots = availableRescheduleSlots ?? [];

  const answerValues = answerResponse?.answers ?? detail?.answers ?? {};
  const answerVersion = adminForms?.flatMap((form) => form.versions ?? []).find((version) => version.id === answerResponse?.formVersionId);
  const answerLabels = new Map(answerVersion?.sections.flatMap((section) => section.fields.map((field) => [field.id, field.label] as const)) ?? []);
  const answers = Object.entries(answerValues).map(([fieldId, value]) => ({
    label: answerLabels.get(fieldId) || fieldId,
    value: Array.isArray(value) ? value.join(", ") : typeof value === "boolean" ? value ? "Sí" : "No" : String(value),
  }));
  const allowedStatuses: ReservationStatus[] = detail?.status === "PENDING"
    ? ["PENDING_VALIDATION", "CONFIRMED", "CANCELLED"]
    : detail?.status === "PENDING_VALIDATION"
      ? ["CONFIRMED", "CANCELLED"]
      : detail?.status === "CONFIRMED"
        ? ["ATTENDED", "NO_SHOW", "CANCELLED"]
        : [];
  const manageableStatuses = allowedStatuses.filter((status) => {
    if (status === "ATTENDED" || status === "NO_SHOW") return user?.role === "ADMIN" || user?.role === "CONTROL";
    return user?.role === "ADMIN" || user?.role === "SCHOLARSHIP_MANAGER";
  });
  const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
  const currentDateTime = new Date();
  const currentTime = `${String(currentDateTime.getHours()).padStart(2, "0")}:${String(currentDateTime.getMinutes()).padStart(2, "0")}`;
  const hasNotStarted = Boolean(detail?.slotDate && detail.startTime &&
    (detail.slotDate > today || detail.slotDate === today && detail.startTime.slice(0, 5) > currentTime));
  const canManageOwnReservation = readOnly &&
    (detail?.status === "PENDING" || detail?.status === "PENDING_VALIDATION") && hasNotStarted;

  const updateStatus = async () => {
    if (!detail) return;
    const targetStatus = nextStatus || detail.status;
    if (targetStatus === detail.status) return;
    if ((targetStatus === "CANCELLED" || targetStatus === "NO_SHOW") && !reason.trim()) {
      toast.error("Escribe el motivo requerido para este cambio.");
      return;
    }
    setSaving(true);
    try {
      await reservationsService.updateReservationStatus(detail.id, targetStatus, reason);
      toast.success("El estado de la reservación fue actualizado.");
      setReason("");
      setNextStatus("");
      reload();
      reloadHistory();
      reloadNotifications();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const saveOwnerChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!detail || !ownerReason.trim()) {
      toast.error("Escribe el motivo de la actualización.");
      return;
    }
    if (contactName.trim() === detail.contactName && contactEmail.trim() === detail.contactEmail &&
      (contactPhone.trim() || null) === detail.contactPhone && (institution.trim() || null) === detail.institution &&
      (notes.trim() || null) === detail.notes) {
      toast.info("No hay cambios para guardar.");
      return;
    }
    setSaving(true);
    try {
      await reservationsService.updateReservation(detail.id, {
        contactName: contactName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim() || null,
        institution: institution.trim() || null,
        notes: notes.trim() || null,
        reason: ownerReason.trim(),
      });
      toast.success("Los datos de la reservación se actualizaron.");
      setEditing(false);
      setOwnerReason("");
      reload();
      reloadHistory();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const cancelOwnReservation = async () => {
    if (!detail || !ownerReason.trim()) {
      toast.error("Escribe el motivo de cancelación.");
      return;
    }
    setSaving(true);
    try {
      await reservationsService.cancelReservation(detail.id, ownerReason.trim());
      toast.success("La reservación fue cancelada.");
      setOwnerReason("");
      reload();
      reloadHistory();
      reloadNotifications();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const rescheduleOwnReservation = async () => {
    if (!detail || !selectedSlotId || !ownerReason.trim()) {
      toast.error("Selecciona una franja y escribe el motivo de reprogramación.");
      return;
    }
    setSaving(true);
    try {
      await reservationsService.rescheduleReservation(detail.id, selectedSlotId, ownerReason.trim());
      toast.success("La visita fue reprogramada.");
      setRescheduling(false);
      setOwnerReason("");
      reload();
      reloadHistory();
    } catch (error) {
      toast.error(apiMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const retryNotification = async (notificationId: string) => {
    try {
      await reservationsService.retryReservationNotification(notificationId);
      toast.success("Se encoló el reintento de notificación.");
      reloadNotifications();
    } catch (error) {
      toast.error(apiMessage(error));
    }
  };

  const startEditing = () => {
    if (!detail) return;
    setContactName(detail.contactName);
    setContactEmail(detail.contactEmail);
    setContactPhone(detail.contactPhone ?? "");
    setInstitution(detail.institution ?? "");
    setNotes(detail.notes ?? "");
    setEditing(true);
  };

  return (
    <div className="res-page">
      <header className="res-head">
        <div className="res-head__text">
          <div className="res-detail-title-row">
            <Link to={backPath} className="res-folio-link" aria-label="Volver al listado">
              <ArrowLeft size={16} />
            </Link>
            <span className="res-head__title">{detail?.folio ?? (loading ? "Cargando…" : "Reservación")}</span>
            {detail && <StatusBadge status={detail.status} />}
          </div>
          {detail && <p className="res-head__subtitle">{detail.contactName} · {detail.institution || "Sin institución"}</p>}
        </div>
      </header>

      <div className="res-content">
        {loading && <p className="res-empty">Cargando reservación…</p>}
        {error && <p className="res-empty" role="alert">{error} <button type="button" onClick={reload}>Reintentar</button></p>}
        {detail && (
          <div className="res-detail-grid">
            <div>
              <section className="res-card">
                <div className="res-detail-header"><h2>Información de la reservación</h2></div>
                <div className="res-detail-meta">
                  <Info label="Solicitante" value={detail.contactName} />
                  <Info label="Institución" value={detail.institution || "—"} />
                  <Info label="Correo electrónico" value={detail.contactEmail} />
                  <Info label="Teléfono" value={detail.contactPhone || "—"} />
                  <Info label="Actividad" value={detail.activityName || "—"} />
                  <Info label="Fecha y horario" value={`${dateLabel(detail.slotDate)} · ${detail.startTime?.slice(0, 5) ?? "—"}–${detail.endTime?.slice(0, 5) ?? "—"}`} />
                  <Info label="Visitantes" value={`${detail.visitorCount} · ${detail.requesterType}`} />
                  <Info label="Aviso de privacidad" value={answerResponse?.privacyNoticeVersion ? `Aceptado · versión ${answerResponse.privacyNoticeVersion}` : detail.privacyAccepted ? "Aceptado" : "No registrado"} />
                  {answerResponse?.privacyAcceptedAt && <Info label="Aceptado el" value={new Date(answerResponse.privacyAcceptedAt).toLocaleString("es-MX")} />}
                  <Info label="Creada" value={new Date(detail.createdAt).toLocaleString("es-MX")} />
                  {detail.cancelReason && <Info label="Motivo de cancelación" value={detail.cancelReason} />}
                </div>
                {detail.notes && <><hr className="res-divider" /><Info label="Notas" value={detail.notes} /></>}
                {detail.details.length > 0 && <><hr className="res-divider" /><Info label="Desglose" value={detail.details.map((item) => `${item.visitorTypeName ?? "Visitante"}: ${item.quantity}`).join(" · ")} /></>}
              </section>

              <section className="res-card" style={{ marginTop: "1.25rem" }}>
                <h2 className="res-detail-section-title">Respuestas del formulario</h2>
                {answersLoading ? <p>Cargando respuestas…</p> : answers.length === 0 ? <p>No hay respuestas adicionales.</p> : (
                  <div className="res-answers-list">
                    {answers.map((answer) => <div className="res-answer" key={answer.label}><span className="res-answer__label">{answer.label}</span><div className="res-answer__value">{answer.value}</div></div>)}
                  </div>
                )}
              </section>

              {readOnly && canManageOwnReservation && <section className="res-card" style={{ marginTop: "1.25rem" }}>
                <h2 className="res-detail-section-title">Administrar mi solicitud</h2>
                {!editing && !rescheduling && <div className="res-verdict__actions">
                  <button type="button" className="res-btn-secondary" onClick={startEditing}>Editar contacto y notas</button>
                  <button type="button" className="res-btn-secondary" onClick={() => { setRescheduling(true); setRescheduleDate(""); }}>Reprogramar</button>
                  <button type="button" className="res-btn-secondary" onClick={cancelOwnReservation} disabled={saving}>Cancelar reservación</button>
                </div>}
                {editing && <form className="res-schedule-form" onSubmit={saveOwnerChanges}>
                  <label>Nombre de contacto<input required maxLength={200} value={contactName} onChange={(event) => setContactName(event.target.value)} /></label>
                  <label>Correo electrónico<input required type="email" maxLength={320} value={contactEmail} onChange={(event) => setContactEmail(event.target.value)} /></label>
                  <label>Teléfono<input maxLength={20} value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} /></label>
                  <label>Institución<input maxLength={200} value={institution} onChange={(event) => setInstitution(event.target.value)} /></label>
                  <label className="res-schedule-actions">Notas<textarea maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
                  <label className="res-schedule-actions">Motivo del cambio<input required maxLength={500} value={ownerReason} onChange={(event) => setOwnerReason(event.target.value)} /></label>
                  <div className="res-schedule-actions"><button className="res-btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button><button type="button" className="res-btn-secondary" onClick={() => setEditing(false)}>Cancelar edición</button></div>
                </form>}
                {rescheduling && <div className="res-schedule-form">
                  <label>Fecha nueva<DateInput value={rescheduleDate} min={today} onChange={(event) => { setRescheduleDate(event.target.value); setSelectedSlotId(""); }} /></label>
                  <label>Franja disponible<select value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)} disabled={slotsLoading || !rescheduleSlots.length}>
                    <option value="">{slotsLoading ? "Cargando…" : "Selecciona una franja"}</option>
                    {rescheduleSlots.map((slot) => <option key={slot.slotId} value={slot.slotId}>{slot.startTime.slice(0, 5)}–{slot.endTime.slice(0, 5)} · {slot.slotsLeft} lugares</option>)}
                  </select></label>
                  <label className="res-schedule-actions">Motivo<input required maxLength={500} value={ownerReason} onChange={(event) => setOwnerReason(event.target.value)} /></label>
                  <div className="res-schedule-actions"><button type="button" className="res-btn-primary" onClick={rescheduleOwnReservation} disabled={saving || !selectedSlotId}>{saving ? "Guardando…" : "Confirmar reprogramación"}</button><button type="button" className="res-btn-secondary" onClick={() => setRescheduling(false)}>Volver</button></div>
                </div>}
                {!editing && !rescheduling && <label className="res-verdict__field">Motivo para cancelar<input maxLength={500} value={ownerReason} onChange={(event) => setOwnerReason(event.target.value)} /></label>}
              </section>}
            </div>

            <aside className="res-card res-verdict">
              {!readOnly && manageableStatuses.length > 0 && <>
              <h3 className="res-verdict__title">Actualizar estado</h3>
              <label className="res-verdict__field" htmlFor="reservation-status">Nuevo estado</label>
              <select id="reservation-status" value={nextStatus || detail.status} onChange={(event) => setNextStatus(event.target.value as ReservationStatus)}>
                <option value={detail.status}>{reservationStatusLabels[detail.status]}</option>
                {manageableStatuses.map((status) => <option key={status} value={status}>{reservationStatusLabels[status]}</option>)}
              </select>
              <div className="res-verdict__field">
                <label htmlFor="status-reason">Comentario o motivo del cambio</label>
                <textarea id="status-reason" rows={4} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Máximo 500 caracteres; se guardará en el historial…" />
              </div>
              <div className="res-verdict__actions">
                <button className="res-btn-primary res-btn-success" onClick={updateStatus} disabled={!nextStatus || nextStatus === detail.status || saving}>
                  {saving ? "Guardando…" : "Actualizar estado"}
                </button>
                <Link to={backPath} className="res-btn-secondary" style={{ textAlign: "center" }}>Volver al listado</Link>
              </div>
              </>}
              <section className="res-history">
                <h3>Notificaciones</h3>
                {notificationsLoading ? <p>Cargando notificaciones…</p> : !notifications?.length ? <p>No hay notificaciones registradas.</p> : (
                  <ul>{notifications.map((notification) => <li key={notification.id}>
                    <strong>{notification.type.replaceAll("_", " ")} · {notification.sendStatus}</strong>
                    <span>{notification.attempts} intento(s) · {new Date(notification.createdAt).toLocaleString("es-MX")}</span>
                    {"recipient" in notification && typeof notification.recipient === "string" && <small>{notification.recipient}</small>}
                    {"lastError" in notification && typeof notification.lastError === "string" && <small>{notification.lastError}</small>}
                    {user?.role === "ADMIN" && notification.sendStatus === "FAILED" && "lastError" in notification && <button type="button" className="res-btn-secondary" onClick={() => void retryNotification(notification.id)}>Reintentar</button>}
                  </li>)}</ul>
                )}
              </section>
              <section className="res-history">
                <h3>Historial</h3>
                {historyLoading ? <p>Cargando historial…</p> : !history?.length ? <p>Sin cambios registrados.</p> : (
                  <ul>{history.map((item) => <li key={item.historyId}>
                    <strong>{item.previousStatus ? reservationStatusLabels[item.previousStatus] ?? item.previousStatus : "Creada"} → {reservationStatusLabels[item.newStatus] ?? item.newStatus}</strong>
                    <span>{new Date(item.createdAt).toLocaleString("es-MX")}</span>
                    {item.action && <small>{item.action}</small>}
                    {item.reason && <small>{item.reason}</small>}
                    {item.changesJson && <small>{item.changesJson}</small>}
                  </li>)}</ul>
                )}
              </section>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="res-detail-meta__item"><span className="res-detail-meta__label">{label}</span><span className="res-detail-meta__value">{value}</span></div>;
}