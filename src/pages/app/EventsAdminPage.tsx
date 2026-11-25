
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import * as z from "zod";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
    createEvent,
    deleteEvent,
    getAllEvents,
    publishEvent,
    updateEvent,
    uploadEventImage,
    type ApiEvent,
    type EventPayload,
} from "@/services/eventsApi";
import { resizeImage } from "@/utils/resizeImage";
import { categories } from "@/data/eventCategories";
import EventImagesManager from "@/components/EventImagesManager";
import "./EventsAdminPage.css";

const pad = (n: number) => String(n).padStart(2, "0");


const joinDate = (day: string, time: string) => (day && time ? new Date(`${day}T${time}`) : null);

const openPicker = (e: React.MouseEvent<HTMLInputElement>) => e.currentTarget.showPicker?.();


const timeOptions = Array.from({ length: 72 }, (_, i) => `${pad(6 + Math.floor(i / 4))}:${pad((i % 4) * 15)}`);

const formSchema = z
    .object({
        title: z.string().trim().min(1, "El título es obligatorio").max(300, "Máximo 300 caracteres"),
        category: z.string(),
        audience: z.string().max(60, "Máximo 60 caracteres"),
        venue: z.string().max(200, "Máximo 200 caracteres"),
        description: z.string(),
        startDay: z.string(),
        startTime: z.string(),
        endDay: z.string(),
        endTime: z.string(),
        capacity: z
            .string()
            .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Debe ser un número entero mayor a 0"),
        cost: z
            .string()
            .refine((v) => v === "" || (/^\d{1,9}$/.test(v) && Number(v) <= 100_000_000), "Solo pesos enteros"),
    })
    .refine((d) => !d.startDay || !!d.startTime, { message: "Elige la hora de inicio", path: ["startTime"] })
    .refine((d) => !d.startTime || !!d.startDay, { message: "Elige el día de inicio", path: ["startDay"] })
    .refine((d) => !d.endDay || !!d.endTime, { message: "Elige la hora de fin", path: ["endTime"] })
    .refine((d) => !(d.endDay || d.endTime) || !!d.startDay, {
        message: "Indica primero el inicio",
        path: ["startDay"],
    })
    .refine(
        (d) => {
            const start = joinDate(d.startDay, d.startTime);
            const end = joinDate(d.endDay || d.startDay, d.endTime);
            return !start || !end || end > start;
        },
        { message: "El fin debe ser después del inicio", path: ["endTime"] }
    );

type FormValues = z.infer<typeof formSchema>;

const emptyForm: FormValues = {
    title: "",
    category: "",
    audience: "",
    venue: "",
    description: "",
    startDay: "",
    startTime: "",
    endDay: "",
    endTime: "",
    capacity: "",
    cost: "0",
};

const statusLabels: Record<ApiEvent["status"], string> = {
    DRAFT: "Borrador",
    PUBLISHED: "Publicado",
    CLOSED: "Cerrado",
    CANCELLED: "Cancelado",
};

function errorMessage(err: unknown): string {
    if (isAxiosError(err)) {
        const details = err.response?.data?.details;
        if (Array.isArray(details) && details.length > 0) {
            return details.map((d: { message: string }) => d.message).join(" ");
        }
        return err.response?.data?.message ?? "Ocurrió un error. Intenta de nuevo.";
    }
    return "Ocurrió un error. Intenta de nuevo.";
}

function formatDate(iso: string | null): string {
    if (!iso) return "Sin fecha";
    return new Date(iso).toLocaleString("es-MX", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });
}

function formatCost(cost: number): string {
    if (cost === 0) return "Gratis";
    return cost.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const emptyToNull = (v: string) => (v.trim() === "" ? null : v.trim());

const toIso = (d: Date | null) => (d ? d.toISOString() : null);

const splitDate = (iso: string | null) => {
    if (!iso) return { day: "", time: "" };
    const d = new Date(iso);
    return {
        day: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
        time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    };
};

const valuesFromEvent = (e: ApiEvent): FormValues => {
    const start = splitDate(e.startDate);
    const end = splitDate(e.endDate);
    return {
        title: e.title,
        category: e.category ?? "",
        audience: e.audience ?? "",
        venue: e.venue ?? "",
        description: e.description ?? "",
        startDay: start.day,
        startTime: start.time,
        // Si termina el mismo día, el día de fin se deja vacío
        endDay: end.day === start.day ? "" : end.day,
        endTime: end.time,
        capacity: e.capacity === null ? "" : String(e.capacity),
        cost: String(e.cost),
    };
};

type Notice = { type: "success" | "error"; text: string };

export default function EventsAdminPage() {
    const [events, setEvents] = useState<ApiEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const [publishingId, setPublishingId] = useState<string | null>(null);
    const [pendingImages, setPendingImages] = useState<File[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        control,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: emptyForm,
    });

    // Cada acción regresa el evento actualizado: se cambia en la lista sin volver a pedirla
    const replaceEvent = (updated: ApiEvent) =>
        setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    const editingEvent = events.find((e) => e.id === editingId) ?? null;

    useEffect(() => {
        let cancelled = false;

        getAllEvents()
            .then((data) => {
                if (cancelled) return;
                setEvents(data);
                setLoadError("");
            })
            .catch(() => {
                if (!cancelled) setLoadError("No pudimos cargar los eventos. Intenta de nuevo más tarde.");
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const openForm = () => {
        setNotice(null);
        setApiError(null);
        setEditingId(null);
        setPendingImages([]);
        reset(emptyForm);
        setShowForm(true);
    };

    const openEdit = (event: ApiEvent) => {
        setNotice(null);
        setApiError(null);
        setEditingId(event.id);
        setPendingImages([]);
        reset(valuesFromEvent(event));
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const closeForm = () => {
        setShowForm(false);
        setPendingImages([]);
        setApiError(null);
    };

    const onSubmit = async (values: FormValues) => {
        setApiError(null);

        const payload: EventPayload = {
            title: values.title.trim(),
            description: emptyToNull(values.description),
            category: emptyToNull(values.category),
            audience: emptyToNull(values.audience),
            venue: emptyToNull(values.venue),
            startDate: toIso(joinDate(values.startDay, values.startTime)),
            endDate: toIso(joinDate(values.endDay || values.startDay, values.endTime)),
            capacity: values.capacity ? Number(values.capacity) : null,
            cost: values.cost ? Number(values.cost) : 0,
        };

        try {
            if (editingId) {
                replaceEvent(await updateEvent(editingId, payload));
                setNotice({ type: "success", text: "Cambios guardados." });
                setShowForm(false);
                setEditingId(null);
            } else {
                let saved = await createEvent(payload);
                try {
                    // De una en una: el backend cuenta el límite con cada subida
                    for (const file of pendingImages) {
                        saved = await uploadEventImage(saved.id, await resizeImage(file));
                    }
                } catch (err) {
                    // El evento ya existe: se queda abierto en edición para reintentar las imágenes
                    setEvents((prev) => [saved, ...prev]);
                    setEditingId(saved.id);
                    setPendingImages([]);
                    reset(valuesFromEvent(saved));
                    setApiError(`El evento se guardó, pero no se pudieron subir todas las imágenes. ${errorMessage(err)}`);
                    return;
                }
                setEvents((prev) => [saved, ...prev]);
                setPendingImages([]);
                setNotice({ type: "success", text: "Evento creado como borrador. Publícalo cuando esté listo." });
                setShowForm(false);
            }
        } catch (err) {
            setApiError(errorMessage(err));
        }
    };

    const handleDelete = async (event: ApiEvent) => {
        if (!window.confirm(`¿Eliminar el borrador "${event.title}"? No se puede deshacer.`)) return;

        setNotice(null);

        try {
            await deleteEvent(event.id);
            setEvents((prev) => prev.filter((e) => e.id !== event.id));
            setNotice({ type: "success", text: `Borrador "${event.title}" eliminado.` });
        } catch (err) {
            setNotice({ type: "error", text: errorMessage(err) });
        }
    };

    const handlePublish = async (event: ApiEvent) => {
        if (!window.confirm(`¿Publicar "${event.title}"? Será visible en el portal público.`)) return;

        setPublishingId(event.id);
        setNotice(null);

        try {
            replaceEvent(await publishEvent(event.id));
            setNotice({ type: "success", text: `"${event.title}" ya es visible en el portal.` });
        } catch (err) {
            setNotice({ type: "error", text: errorMessage(err) });
        } finally {
            setPublishingId(null);
        }
    };

    const currentCategory = useWatch({ control, name: "category" });
    const [startTime, endTime] = useWatch({ control, name: ["startTime", "endTime"] });
    const hoursFor = (current: string) =>
        current && !timeOptions.includes(current) ? [...timeOptions, current].sort() : timeOptions;
    const isLegacyCategory = currentCategory !== "" && !categories.some((c) => c.name === currentCategory);

    const published = events.filter((e) => e.status === "PUBLISHED").length;
    const drafts = events.filter((e) => e.status === "DRAFT").length;

    return (
        <div className="admin-event-page">
            <header className="admin-event-header">
                <div>
                    <h1>Eventos</h1>
                    <p>Crea, revisa y publica los eventos del portal.</p>
                </div>

                {!showForm && (
                    <button type="button" className="admin-event-btn" onClick={openForm}>
                        <Plus size={18} /> Nuevo evento
                    </button>
                )}
            </header>

            {notice && (
                <p className={`admin-event-notice admin-event-notice--${notice.type}`} role="status">
                    {notice.text}
                </p>
            )}

            <section className="admin-event-stats">
                <div className="admin-event-stat">
                    <span>Total</span>
                    <strong>{events.length}</strong>
                </div>

                <div className="admin-event-stat">
                    <span>Publicados</span>
                    <strong>{published}</strong>
                </div>

                <div className="admin-event-stat">
                    <span>En borrador</span>
                    <strong>{drafts}</strong>
                </div>
            </section>

            {showForm && (
                <form className="admin-event-card admin-event-form" onSubmit={handleSubmit(onSubmit)} noValidate>
                    <h2>{editingId ? "Editar evento" : "Nuevo evento"}</h2>

                    <p className="admin-event-hint">
                        {editingId
                            ? "Los cambios se ven en el portal de inmediato si el evento ya está publicado."
                            : "Se guarda como borrador: no aparece en el portal hasta que lo publiques."}
                    </p>

                    <h3>Información general</h3>

                    <div className="admin-event-grid">
                        <div className="admin-event-field admin-event-field--wide">
                            <label htmlFor="ev-title">Título</label>
                            <input
                                id="ev-title"
                                type="text"
                                placeholder="Ej. Noche de astronomía"
                                {...register("title")}
                                className={errors.title ? "admin-event-input--error" : ""}
                            />
                            {errors.title && <span className="admin-event-error">{errors.title.message}</span>}
                        </div>

                        <div className="admin-event-field">
                            <label htmlFor="ev-category">Categoría</label>
                            <select id="ev-category" {...register("category")}>
                                <option value="">Sin categoría</option>
                                {isLegacyCategory && <option value={currentCategory}>{currentCategory}</option>}
                                {categories.map((c) => (
                                    <option key={c.name} value={c.name}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="admin-event-field">
                            <label htmlFor="ev-audience">Público</label>
                            <input
                                id="ev-audience"
                                type="text"
                                placeholder="Ej. Desde 8 años"
                                {...register("audience")}
                                className={errors.audience ? "admin-event-input--error" : ""}
                            />
                            {errors.audience && <span className="admin-event-error">{errors.audience.message}</span>}
                        </div>

                        <div className="admin-event-field admin-event-field--wide">
                            <label htmlFor="ev-description">Descripción</label>
                            <textarea id="ev-description" rows={3} {...register("description")} />
                        </div>

                        <div className="admin-event-field admin-event-field--wide">
                            <label htmlFor="ev-venue">Sede</label>
                            <input
                                id="ev-venue"
                                type="text"
                                placeholder="Ej. Terraza ZigZag"
                                {...register("venue")}
                                className={errors.venue ? "admin-event-input--error" : ""}
                            />
                            {errors.venue && <span className="admin-event-error">{errors.venue.message}</span>}
                        </div>
                    </div>

                    <h3>Fechas</h3>

                    <div className="admin-event-grid">
                        <fieldset className="admin-event-field admin-event-when">
                            <legend>Inicio</legend>
                            <div className="admin-event-when-row">
                                <label className={`admin-event-when-box${errors.startDay ? " admin-event-input--error" : ""}`}>
                                    <CalendarDays size={18} aria-hidden="true" />
                                    <input type="date" aria-label="Día de inicio" onClick={openPicker} {...register("startDay")} />
                                </label>
                                <label className={`admin-event-when-box${errors.startTime ? " admin-event-input--error" : ""}`}>
                                    <Clock size={18} aria-hidden="true" />
                                    <select aria-label="Hora de inicio" {...register("startTime")}>
                                        <option value="">Hora</option>
                                        {hoursFor(startTime).map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {(errors.startDay || errors.startTime) && (
                                <span className="admin-event-error">{(errors.startDay ?? errors.startTime)?.message}</span>
                            )}
                        </fieldset>

                        <fieldset className="admin-event-field admin-event-when">
                            <legend>Fin (opcional)</legend>
                            <div className="admin-event-when-row">
                                <label className={`admin-event-when-box${errors.endDay ? " admin-event-input--error" : ""}`}>
                                    <CalendarDays size={18} aria-hidden="true" />
                                    <input type="date" aria-label="Día de fin" onClick={openPicker} {...register("endDay")} />
                                </label>
                                <label className={`admin-event-when-box${errors.endTime ? " admin-event-input--error" : ""}`}>
                                    <Clock size={18} aria-hidden="true" />
                                    <select aria-label="Hora de fin" {...register("endTime")}>
                                        <option value="">Hora</option>
                                        {hoursFor(endTime).map((t) => (
                                            <option key={t} value={t}>
                                                {t}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            {errors.endDay || errors.endTime ? (
                                <span className="admin-event-error">{(errors.endDay ?? errors.endTime)?.message}</span>
                            ) : (
                                <span className="admin-event-hint">Si termina el mismo día, solo elige la hora.</span>
                            )}
                        </fieldset>
                    </div>

                    <h3>Aforo y costo</h3>

                    <div className="admin-event-grid">
                        <div className="admin-event-field">
                            <label htmlFor="ev-capacity">Aforo (opcional)</label>
                            <input
                                id="ev-capacity"
                                type="text"
                                inputMode="numeric"
                                placeholder="Sin límite"
                                {...register("capacity")}
                                className={errors.capacity ? "admin-event-input--error" : ""}
                            />
                            {errors.capacity && <span className="admin-event-error">{errors.capacity.message}</span>}
                        </div>

                        <div className="admin-event-field">
                            <label htmlFor="ev-cost">Costo (MXN)</label>
                            <input
                                id="ev-cost"
                                type="text"
                                inputMode="numeric"
                                placeholder="0 = gratis"
                                {...register("cost")}
                                className={errors.cost ? "admin-event-input--error" : ""}
                            />
                            {errors.cost && <span className="admin-event-error">{errors.cost.message}</span>}
                        </div>
                    </div>
                    <h3>Imágenes</h3>

                    <EventImagesManager
                        event={editingEvent}
                        onChange={replaceEvent}
                        pending={pendingImages}
                        onPendingChange={setPendingImages}
                    />

                    {apiError && (
                        <p className="admin-event-notice admin-event-notice--error" role="alert">
                            {apiError}
                        </p>
                    )}

                    <div className="admin-event-actions">
                        <button
                            type="button"
                            className="admin-event-btn admin-event-btn--ghost"
                            onClick={closeForm}
                        >
                            Cancelar
                        </button>

                        <button type="submit" className="admin-event-btn" disabled={isSubmitting}>
                            {isSubmitting ? "Guardando..." : editingId ? "Guardar cambios" : "Guardar evento"}
                        </button>
                    </div>
                </form>
            )}

            <section className="admin-event-card">
                {loading ? (
                    <p className="admin-event-empty">Cargando eventos...</p>
                ) : loadError ? (
                    <p className="admin-event-empty">{loadError}</p>
                ) : events.length === 0 ? (
                    <p className="admin-event-empty">
                        Todavía no hay eventos. Crea el primero con "Nuevo evento".
                    </p>
                ) : (
                    <div className="admin-event-table-wrap">
                        <table className="admin-event-table">
                            <thead>
                                <tr>
                                    <th>Evento</th>
                                    <th>Inicio</th>
                                    <th>Público</th>
                                    <th>Costo</th>
                                    <th>Estado</th>
                                    <th></th>
                                </tr>
                            </thead>

                            <tbody>
                                {events.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            <strong>{event.title}</strong>
                                            <span className="admin-event-sub">
                                                {event.category ?? "Sin categoría"}
                                            </span>
                                        </td>

                                        <td>{formatDate(event.startDate)}</td>
                                        <td>{event.audience ?? "—"}</td>
                                        <td>{formatCost(event.cost)}</td>

                                        <td>
                                            <span className={`admin-event-badge admin-event-badge--${event.status.toLowerCase()}`}>
                                                {statusLabels[event.status]}
                                            </span>
                                        </td>

                                        <td className="admin-event-row-actions">
                                            {/* Un evento cerrado o cancelado ya es historia: no se edita */}
                                            {(event.status === "DRAFT" || event.status === "PUBLISHED") && (
                                                <button
                                                    type="button"
                                                    className="admin-event-btn admin-event-btn--ghost admin-event-btn--small"
                                                    onClick={() => openEdit(event)}
                                                >
                                                    Editar
                                                </button>
                                            )}

                                            {event.status === "PUBLISHED" && (
                                                <Link
                                                    className="admin-event-btn admin-event-btn--ghost admin-event-btn--small"
                                                    to={`/app/eventos/${event.id}/inscritos`}
                                                >
                                                    Inscritos
                                                </Link>
                                            )}

                                            {event.status === "DRAFT" && (
                                                <>
                                                    <button
                                                        type="button"
                                                        className="admin-event-btn admin-event-btn--small"
                                                        disabled={publishingId === event.id}
                                                        onClick={() => handlePublish(event)}
                                                    >
                                                        {publishingId === event.id ? "Publicando..." : "Publicar"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="admin-event-btn admin-event-btn--danger admin-event-btn--small"
                                                        onClick={() => handleDelete(event)}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
