import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import * as z from "zod";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import {
    createEvent,
    deleteEvent,
    getAllEvents,
    publishEvent,
    updateEvent,
    type ApiEvent,
    type EventPayload,
} from "@/services/eventsApi";
import { categories } from "@/data/eventCategories";
import "./EventsAdminPage.css";

const formSchema = z
    .object({
        title: z.string().trim().min(1, "El título es obligatorio").max(300, "Máximo 300 caracteres"),
        category: z.string(),
        audience: z.string().max(60, "Máximo 60 caracteres"),
        venue: z.string().max(200, "Máximo 200 caracteres"),
        description: z.string(),
        startDate: z.string(),
        endDate: z.string(),
        capacity: z
            .string()
            .refine((v) => v === "" || (/^\d+$/.test(v) && Number(v) > 0), "Debe ser un número entero mayor a 0"),
        cost: z
            .string()
            .refine((v) => v === "" || /^\d{1,8}(\.\d{1,2})?$/.test(v), "Monto inválido (hasta 2 decimales)"),
    })
    .refine((d) => !d.endDate || !!d.startDate, {
        message: "Indica primero la fecha de inicio",
        path: ["startDate"],
    })
    .refine((d) => !d.endDate || !d.startDate || new Date(d.endDate) >= new Date(d.startDate), {
        message: "La fecha de fin no puede ser anterior a la de inicio",
        path: ["endDate"],
    });

type FormValues = z.infer<typeof formSchema>;

const emptyForm: FormValues = {
    title: "",
    category: "",
    audience: "",
    venue: "",
    description: "",
    startDate: "",
    endDate: "",
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


const toIso = (v: string) => (v ? new Date(v).toISOString() : null);


const toLocalInput = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};


const valuesFromEvent = (e: ApiEvent): FormValues => ({
    title: e.title,
    category: e.category ?? "",
    audience: e.audience ?? "",
    venue: e.venue ?? "",
    description: e.description ?? "",
    startDate: toLocalInput(e.startDate),
    endDate: toLocalInput(e.endDate),
    capacity: e.capacity === null ? "" : String(e.capacity),
    cost: String(e.cost),
});

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

    const [refreshKey, setRefreshKey] = useState(0);
    const reload = () => setRefreshKey((k) => k + 1);

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
    }, [refreshKey]);

    const openForm = () => {
        setNotice(null);
        setApiError(null);
        setEditingId(null);
        reset(emptyForm);
        setShowForm(true);
    };

    const openEdit = (event: ApiEvent) => {
        setNotice(null);
        setApiError(null);
        setEditingId(event.id);
        reset(valuesFromEvent(event));
        setShowForm(true);
        // El formulario aparece arriba de la tabla
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const closeForm = () => {
        setShowForm(false);
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
            startDate: toIso(values.startDate),
            endDate: toIso(values.endDate),
            capacity: values.capacity ? Number(values.capacity) : null,
            cost: values.cost ? Number(values.cost) : 0,
        };
        try {
            if (editingId) {
                await updateEvent(editingId, payload);
                setNotice({ type: "success", text: "Cambios guardados." });
            } else {
                await createEvent(payload);
                setNotice({ type: "success", text: "Evento creado como borrador. Publícalo cuando esté listo." });
            }
            setShowForm(false);
            setEditingId(null);
            reload();
        } catch (err) {
            setApiError(errorMessage(err));
        }
    };

    const handleDelete = async (event: ApiEvent) => {
        if (!window.confirm(`¿Eliminar el borrador "${event.title}"? No se puede deshacer.`)) return;
        setNotice(null);
        try {
            await deleteEvent(event.id);
            setNotice({ type: "success", text: `Borrador "${event.title}" eliminado.` });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: errorMessage(err) });
        }
    };

    const handlePublish = async (event: ApiEvent) => {
        // Publicar lo hace visible para todos
        if (!window.confirm(`¿Publicar "${event.title}"? Será visible en el portal público.`)) return;
        setPublishingId(event.id);
        setNotice(null);
        try {
            await publishEvent(event.id);
            setNotice({ type: "success", text: `"${event.title}" ya es visible en el portal.` });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: errorMessage(err) });
        } finally {
            setPublishingId(null);
        }
    };

    const currentCategory = useWatch({ control, name: "category" });
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
                        <div className="admin-event-field">
                            <label htmlFor="ev-start">Inicio</label>
                            <input
                                id="ev-start"
                                type="datetime-local"
                                {...register("startDate")}
                                className={errors.startDate ? "admin-event-input--error" : ""}
                            />
                            {errors.startDate && <span className="admin-event-error">{errors.startDate.message}</span>}
                        </div>
                        <div className="admin-event-field">
                            <label htmlFor="ev-end">Fin</label>
                            <input
                                id="ev-end"
                                type="datetime-local"
                                {...register("endDate")}
                                className={errors.endDate ? "admin-event-input--error" : ""}
                            />
                            {errors.endDate && <span className="admin-event-error">{errors.endDate.message}</span>}
                        </div>
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
                                inputMode="decimal"
                                placeholder="0 = gratis"
                                {...register("cost")}
                                className={errors.cost ? "admin-event-input--error" : ""}
                            />
                            {errors.cost && <span className="admin-event-error">{errors.cost.message}</span>}
                        </div>
                    </div>

                    {apiError && (
                        <p className="admin-event-notice admin-event-notice--error" role="alert">
                            {apiError}
                        </p>
                    )}

                    <div className="admin-event-actions">
                        <button type="button" className="admin-event-btn admin-event-btn--ghost" onClick={closeForm}>
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
                    <p className="admin-event-empty">Todavía no hay eventos. Crea el primero con "Nuevo evento".</p>
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
                                            <span className="admin-event-sub">{event.category ?? "Sin categoría"}</span>
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