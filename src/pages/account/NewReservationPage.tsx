import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../../context/useAuth";
import AccountNavBar from "../../components/AccountNavBar";
import DateInput from "@/components/DateInput";
import { Link } from "react-router-dom";
import { ChevronRight, Info } from "lucide-react";
import ReservationDynamicForm from "../../components/ReservationDynamicForm";
import { useToast } from "../../context/useToast";
import { apiMessage, useApiResource } from "../../hooks/useApiResource";
import {
    reservationFormsService,
    validateReservationFormAnswers,
    type ReservationAnswers,
    type ReservationForm,
} from "../../services/reservation-forms.service";
import {
    reservationsService,
    type ActivityOption,
    type RequesterType,
    type VisitorType,
} from "../../services/reservations.service";
import "./NewReservationPage.css";

const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    CASHIER: "Taquilla",
    GUIDE: "Guía",
    SCHOLARSHIP_MANAGER: "Gestor Becas",
    USER: "Visitante",
};

export default function NewReservationPage() {
    const { user, logout } = useAuth();
    const toast = useToast();
    const userName = user?.sub ?? "Usuario";
    const userRole = user ? roleLabels[user.role] ?? user.role : "";
    const initials = userName.slice(0, 2).toUpperCase();
    const [activities, setActivities] = useState<ActivityOption[]>([]);
    const [visitorTypes, setVisitorTypes] = useState<VisitorType[]>([]);
    const [selectedActivity, setSelectedActivity] = useState("");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
    const [answers, setAnswers] = useState<ReservationAnswers>({});
    const [answerErrors, setAnswerErrors] = useState<Record<string, string>>({});
    const [createdFolio, setCreatedFolio] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [pageError, setPageError] = useState("");
    const [applicantName, setApplicantName] = useState([user?.given_name, user?.family_name].filter(Boolean).join(" "));
    const [institution, setInstitution] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState(user?.email ?? user?.sub ?? "");
    const [visitDate, setVisitDate] = useState("");
    const [requesterType, setRequesterType] = useState<RequesterType>("SCHOOL");
    const [visitorCount, setVisitorCount] = useState(1);
    const [visitorQuantities, setVisitorQuantities] = useState<Record<string, number>>({});
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [notes, setNotes] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([reservationsService.getActivities(), reservationsService.getVisitorTypes()])
            .then(([loadedActivities, loadedVisitorTypes]) => {
                if (!active) return;
                const reservableActivities = loadedActivities.filter((activity) => activity.active && activity.isReservable);
                setActivities(reservableActivities);
                setVisitorTypes(loadedVisitorTypes);
                setSelectedActivity(reservableActivities[0]?.id ?? "");
                setLoading(false);
            })
            .catch((error: unknown) => {
                if (!active) return;
                setPageError(apiMessage(error));
                setLoading(false);
            });
        return () => { active = false; };
    }, []);

    const loadActiveForm = useCallback(
        () => selectedActivity ? reservationFormsService.getActive(selectedActivity) : Promise.resolve(null),
        [selectedActivity],
    );
    const { data: activeFormData, loading: formLoading } = useApiResource(loadActiveForm);
    const reservationForm = useMemo<ReservationForm | null>(() => activeFormData ? {
        id: activeFormData.id,
        name: "Formulario de reservación",
        activityId: selectedActivity,
        active: true,
        sections: activeFormData.sections,
        updatedAt: activeFormData.publishedAt ?? activeFormData.createdAt,
    } : null, [activeFormData, selectedActivity]);

    const loadAvailability = useCallback(
        () => selectedActivity && visitDate
            ? reservationsService.getAvailability(selectedActivity, visitDate)
            : Promise.resolve([]),
        [selectedActivity, visitDate],
    );
    const { data: availabilityData, loading: availabilityLoading, error: availabilityError } = useApiResource(loadAvailability);
    const availability = availabilityData ?? [];

    const today = useMemo(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    }, []);

    const selectedSlot = availability.find((slot) => slot.slotId === selectedTimeSlot);
    const detailTotal = Object.values(visitorQuantities).reduce((sum, quantity) => sum + quantity, 0);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPageError("");
        if (!applicantName.trim()) {
            setPageError("Escribe el nombre de la persona solicitante.");
            return;
        }
        if (formLoading) {
            setPageError("Espera a que cargue el formulario de reservación.");
            return;
        }
        if (!selectedSlot) {
            setPageError("Selecciona una franja disponible antes de continuar.");
            return;
        }
        if (!privacyAccepted) {
            setPageError("Debes aceptar el aviso de privacidad para enviar la reservación.");
            return;
        }
        const formErrors = reservationForm ? validateReservationFormAnswers(reservationForm, answers) : {};
        setAnswerErrors(formErrors);
        if (Object.keys(formErrors).length > 0) {
            setPageError("Completa las respuestas obligatorias del formulario.");
            return;
        }
        if (detailTotal > 0 && detailTotal !== visitorCount) {
            setPageError(`El desglose por tipo de visitante debe sumar ${visitorCount}.`);
            return;
        }
        if (notes.length > 1000) {
            setPageError("Las notas no pueden superar 1000 caracteres.");
            return;
        }
        setSubmitting(true);
        try {
            const created = await reservationsService.createReservation({
                timeSlotId: selectedSlot.slotId,
                contactName: applicantName.trim(),
                contactEmail: email.trim(),
                contactPhone: phone.trim() || null,
                institution: institution.trim() || null,
                requesterType,
                visitorCount,
                notes: notes.trim() || null,
                privacyAccepted: true,
                ...(reservationForm ? {
                    formVersionId: reservationForm.id,
                    answers: Object.fromEntries(Object.entries(answers).filter(([, value]) =>
                        value !== "" && value !== undefined && !(Array.isArray(value) && value.length === 0),
                    )),
                } : {}),
                details: Object.entries(visitorQuantities)
                    .filter(([, quantity]) => quantity > 0)
                    .map(([visitorTypeId, quantity]) => ({ visitorTypeId, quantity })),
            });
            setCreatedFolio(created.folio);
            toast.success(`Reservación ${created.folio} enviada correctamente.`);
        } catch (error) {
            setPageError(apiMessage(error));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="new-reservation-page">
            <div className="account-page-main">
                <AccountNavBar
                    userName={userName}
                    userRole={userRole}
                    initials={initials}
                    logout={logout}
                    activeNav="nueva-reservacion"
                />

                <main className="new-reservation-content">
                    {/* Page title */}
                    <div className="new-reservation-header">
                        <div>
                            <h1 className="new-reservation-title">Nueva reservación para grupo</h1>
                            <p className="new-reservation-subtitle">La solicitud quedará asociada a tu cuenta.</p>
                        </div>
                        <span className="new-reservation-draft-badge">{createdFolio ? "ENVIADA" : "SOLICITUD"}</span>
                    </div>

                    {(pageError || availabilityError) && <p className="reservation-form-error" role="alert">{pageError || availabilityError}</p>}
                    {createdFolio && (
                        <section className="reservation-created" role="status">
                            <h2>¡Tu solicitud fue enviada!</h2>
                            <p>Folio: <strong>{createdFolio}</strong>. Su estado inicial es Pendiente.</p>
                            <Link to="/cuenta/reservaciones" className="btn-continue">Consultar mis reservaciones</Link>
                        </section>
                    )}


                    {/* Main form layout */}
                    <div className="new-reservation-layout">
                        {/* Form section */}
                        <form className="new-reservation-form" onSubmit={handleSubmit}>
                            {/* Datos del solicitante */}
                            <section className="form-section">
                                <h2 className="form-section-title">Datos del solicitante y la institución</h2>
                                <p className="form-section-subtitle">Los datos de tu cuenta se usarán para notificaciones.</p>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="applicant-name">Nombre del solicitante o representante</label>
                                        <input
                                            id="applicant-name"
                                            type="text"
                                            className="form-input"
                                            value={applicantName}
                                            maxLength={200}
                                            required
                                            onChange={(e) => setApplicantName(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="institution">Institución u organización</label>
                                        <input
                                            id="institution"
                                            type="text"
                                            className="form-input"
                                            value={institution}
                                            maxLength={200}
                                            onChange={(e) => setInstitution(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="phone">Teléfono de contacto</label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="form-input"
                                            value={phone}
                                            maxLength={20}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="email">Correo electrónico</label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="form-input"
                                            value={email}
                                            maxLength={320}
                                            required
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Fecha y horario */}
                            <section className="form-section">
                                <h2 className="form-section-title">Fecha y horario tentativos</h2>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="activity">Actividad</label>
                                        <select id="activity" className="form-input" value={selectedActivity} required disabled={loading || activities.length === 0} onChange={(event) => { setSelectedActivity(event.target.value); setVisitDate(""); setSelectedTimeSlot(""); setAnswers({}); setAnswerErrors({}); }}>
                                            <option value="">Selecciona una actividad</option>
                                            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="visit-date">Fecha de visita</label>
                                        <DateInput
                                            id="visit-date"
                                            className="form-input"
                                            value={visitDate}
                                            min={today}
                                            required
                                            disabled={!selectedActivity || loading}
                                            onChange={(e) => { setVisitDate(e.target.value); setSelectedTimeSlot(""); }}
                                        />
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label">Horario disponible</label>
                                        <div className="time-slots">
                                            {availability.map((slot) => (
                                                <label
                                                    key={slot.slotId}
                                                    className={`time-slot ${selectedTimeSlot === slot.slotId ? "selected" : ""}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="timeSlot"
                                                        value={slot.slotId}
                                                        checked={selectedTimeSlot === slot.slotId}
                                                        required
                                                        onChange={() => setSelectedTimeSlot(slot.slotId)}
                                                    />
                                                    <span>{slot.startTime.slice(0, 5)} a {slot.endTime.slice(0, 5)} · {slot.slotsLeft} lugares</span>
                                                </label>
                                            ))}
                                        </div>
                                        <p className="time-slots-note">
                                            {availabilityLoading ? "Consultando disponibilidad…" : visitDate && availability.length === 0 ? "No hay horarios disponibles para esta fecha." : "La disponibilidad se confirma al enviar la solicitud."}
                                        </p>
                                    </div>
                                </div>

                                <div className="form-info-banner">
                                    <Info size={14} />
                                    <p>La fecha debe ser actual o futura; el espacio se vuelve a validar al registrar.</p>
                                </div>
                            </section>

                            <section className="form-section">
                                <h2 className="form-section-title">Tipo de solicitud y grupo</h2>

                                <div className="form-grid">
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="requester-type">Tipo de solicitante</label>
                                        <select id="requester-type" className="form-input" value={requesterType} onChange={(event) => setRequesterType(event.target.value as RequesterType)}>
                                            <option value="SCHOOL">Escuela</option>
                                            <option value="GROUP">Grupo</option>
                                            <option value="INDIVIDUAL">Individual</option>
                                        </select>
                                    </div>
                                    <div className="form-field">
                                        <label className="form-label" htmlFor="visitor-count">Cantidad de visitantes</label>
                                        <input id="visitor-count" className="form-input" type="number" min={1} step={1} required value={visitorCount} onChange={(event) => setVisitorCount(Math.max(1, Number(event.target.value) || 1))} />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <span className="form-label">Desglose por tipo de visitante (opcional)</span>
                                    {visitorTypes.length === 0 ? <p>No hay tipos de visitante activos.</p> : visitorTypes.map((type) => (
                                        <label className="reservation-visitor-quantity" key={type.id}>
                                            <span>{type.name}</span>
                                            <input type="number" min={0} step={1} value={visitorQuantities[type.id] ?? 0} onChange={(event) => setVisitorQuantities((current) => ({ ...current, [type.id]: Math.max(0, Number(event.target.value) || 0) }))} />
                                        </label>
                                    ))}
                                    {detailTotal > 0 && <small>Desglose: {detailTotal} de {visitorCount} visitantes</small>}
                                </div>

                            </section>

                            {formLoading && <p role="status">Cargando formulario de reservación…</p>}
                            {reservationForm && (
                                <ReservationDynamicForm
                                    form={reservationForm}
                                    answers={answers}
                                    errors={answerErrors}
                                    onChange={(fieldId, value) => {
                                        setAnswers((current) => ({ ...current, [fieldId]: value }));
                                        setAnswerErrors((current) => {
                                            const next = { ...current };
                                            delete next[fieldId];
                                            return next;
                                        });
                                    }}
                                />
                            )}

                            <section className="form-section">
                                <h2 className="form-section-title">Notas y privacidad</h2>
                                <div className="form-field">
                                    <label className="form-label" htmlFor="reservation-notes">Notas adicionales</label>
                                    <textarea id="reservation-notes" className="form-input" rows={3} maxLength={1000} value={notes} onChange={(event) => setNotes(event.target.value)} />
                                </div>
                                <label className="reservation-privacy">
                                    <input type="checkbox" checked={privacyAccepted} required onChange={(event) => setPrivacyAccepted(event.target.checked)} />
                                    Acepto el aviso de privacidad y el uso de mis datos para gestionar esta solicitud.
                                </label>
                                <small>Las respuestas dinámicas se almacenan de forma estructurada y separada de las notas.</small>
                            </section>

                            {/* Action buttons */}
                            <div className="form-actions">
                                <button type="button" className="btn-draft" onClick={() => { setAnswers({}); setAnswerErrors({}); setNotes(""); }}>Limpiar respuestas</button>
                                <button type="submit" className="btn-continue" disabled={loading || formLoading || submitting || Boolean(createdFolio)}>
                                    {submitting ? "Enviando…" : "Enviar reservación"} <ChevronRight size={16} />
                                </button>
                            </div>
                        </form>

                        {/* Sidebar */}
                        <aside className="new-reservation-sidebar">
                            <div className="sidebar-card">
                                <h3 className="sidebar-card-title">Resumen</h3>

                                <div className="summary-item">
                                    <span className="summary-label">Cuenta</span>
                                    <span className="summary-value verified">Sesión iniciada</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Actividad</span>
                                    <span className="summary-value">{activities.find((activity) => activity.id === selectedActivity)?.name ?? "Selecciona una actividad"}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Fecha y horario</span>
                                    <span className="summary-value">{selectedSlot ? `${selectedSlot.slotDate} · ${selectedSlot.startTime.slice(0, 5)}–${selectedSlot.endTime.slice(0, 5)}` : "Sin seleccionar"}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Visitantes</span>
                                    <span className="summary-value">{visitorCount}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-label">Formulario adicional</span>
                                    <span className="summary-value">{reservationForm?.name ?? "No configurado"}</span>
                                </div>
                            </div>

                            <div className="sidebar-card contact-card">
                                <h3 className="contact-card-title">Información de disponibilidad</h3>
                                <div className="contact-info">
                                    <div className="contact-item">
                                        <Info size={14} />
                                        <div>
                                            <p>Los horarios se muestran según la disponibilidad de la actividad seleccionada.</p>
                                        </div>
                                    </div>
                                    <div className="contact-item">
                                        <Info size={14} />
                                        <p>La solicitud y sus actualizaciones quedan asociadas a tu cuenta.</p>
                                    </div>
                                    <div className="contact-item">
                                        <Info size={14} />
                                        <p>El aforo se confirma al enviar la solicitud.</p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}
