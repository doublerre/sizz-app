import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";
import { CATEGORY_THEMES, type CategoryKey } from "../public/ExperiencesPage";
import { AUDIENCES, LOCATIONS, type ExperienceStatus } from "./experience.data";
import "./ExperienceForm.css";

/* ───────────── Tipos ───────────── */

export interface ExperienceFormValues {
    name: string;
    description: string;
    topic: CategoryKey | "";
    audiences: string[];
    durationMinutes: string;
    capacity: string;
    location: string;
    status: ExperienceStatus;
    order: string; // vacío = automático
    tagLabel: string;
    showInCatalog: boolean;
    availableForBooking: boolean;
}

export const EMPTY_FORM: ExperienceFormValues = {
    name: "",
    description: "",
    topic: "",
    audiences: [],
    durationMinutes: "",
    capacity: "",
    location: "",
    status: "borrador",
    order: "",
    tagLabel: "",
    showInCatalog: true,
    availableForBooking: true,
};

type Errors = Partial<Record<keyof ExperienceFormValues, string>>;

interface ExperienceFormProps {
    mode: "create" | "edit";
    initialValues?: ExperienceFormValues;
    /** Texto de "Última modificación". */
    lastModified?: string;
    onSubmit: (values: ExperienceFormValues) => void | Promise<void>;
    onCancel: () => void;
}

const STATUS_OPTIONS: { value: ExperienceStatus; label: string }[] = [
    { value: "borrador", label: "Borrador" },
    { value: "publicada", label: "Publicada" },
    { value: "revision", label: "Requiere revisión" },
];

const toTitleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

/* ───────────── Subcomponentes ───────────── */

function Field({
    label,
    required,
    htmlFor,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    htmlFor: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="exf-field">
            <label className="exf-label" htmlFor={htmlFor}>
                {label}
                {required && " *"}
            </label>
            {children}
            {error && (
                <span className="exf-error" id={`${htmlFor}-error`} role="alert">
                    {error}
                </span>
            )}
        </div>
    );
}

function SelectControl({
    id,
    value,
    onChange,
    placeholder,
    options,
    invalid,
    describedBy,
    strong,
}: {
    id: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    options: { value: string; label: string }[];
    invalid?: boolean;
    describedBy?: string;
    strong?: boolean;
}) {
    const classes = ["exf-control", "exf-control--select"];
    if (!value) classes.push("exf-control--empty");
    if (strong && value) classes.push("exf-control--strong");
    return (
        <div className="exf-select">
            <select
                id={id}
                className={classes.join(" ")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
            >
                {placeholder !== undefined && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <ChevronDown size={16} className="exf-select__chevron" aria-hidden="true" />
        </div>
    );
}

function AudienceSelect({
    id,
    value,
    onChange,
    invalid,
    describedBy,
}: {
    id: string;
    value: string[];
    onChange: (v: string[]) => void;
    invalid?: boolean;
    describedBy?: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    const toggle = (a: string) =>
        onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);

    return (
        <div className="exf-select" ref={ref}>
            <button
                type="button"
                id={id}
                className={`exf-control exf-control--select exf-control--button${value.length ? "" : " exf-control--empty"}`}
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-invalid={invalid || undefined}
                aria-describedby={describedBy}
            >
                {value.length ? value.join(", ") : "Selecciona el público"}
            </button>
            <ChevronDown size={16} className="exf-select__chevron" aria-hidden="true" />

            {open && (
                <ul className="exf-menu" role="listbox" aria-multiselectable="true">
                    {AUDIENCES.map((a) => {
                        const selected = value.includes(a);
                        return (
                            <li
                                key={a}
                                role="option"
                                aria-selected={selected}
                                className={`exf-menu__item${selected ? " exf-menu__item--selected" : ""}`}
                                onClick={() => toggle(a)}
                            >
                                <span>{a}</span>
                                {selected && <Check size={14} />}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            className="exf-switch"
            onClick={() => onChange(!checked)}
        >
            <span className={`exf-switch__track${checked ? " exf-switch__track--on" : ""}`}>
                <span className="exf-switch__thumb" />
            </span>
            <span className="exf-switch__label">{label}</span>
        </button>
    );
}

/* ───────────── Formulario ───────────── */

export default function ExperienceForm({
    mode,
    initialValues = EMPTY_FORM,
    lastModified,
    onSubmit,
    onCancel,
}: ExperienceFormProps) {
    const [values, setValues] = useState<ExperienceFormValues>(initialValues);
    const [errors, setErrors] = useState<Errors>({});
    const [saving, setSaving] = useState(false);

    const isEdit = mode === "edit";

    const set = <K extends keyof ExperienceFormValues>(key: K, value: ExperienceFormValues[K]) => {
        setValues((v) => ({ ...v, [key]: value }));
        setErrors((e) => ({ ...e, [key]: undefined }));
    };

    const handleTopic = (topic: string) => {
        const key = topic as CategoryKey;
        setValues((v) => ({
            ...v,
            topic: key,
            // Sugiere la etiqueta de la categoría si aún no se eligió una
            tagLabel: v.tagLabel || CATEGORY_THEMES[key].label,
        }));
        setErrors((e) => ({ ...e, topic: undefined }));
    };

    const validate = (): Errors => {
        const e: Errors = {};
        if (!values.name.trim()) e.name = "Escribe el nombre de la experiencia.";
        if (!values.topic) e.topic = "Selecciona una categoría.";
        if (values.audiences.length === 0) e.audiences = "Selecciona al menos un público.";
        if (!(Number(values.durationMinutes) > 0)) e.durationMinutes = "Indica la duración en minutos.";
        if (!(Number(values.capacity) > 0)) e.capacity = "Indica el cupo máximo.";
        if (!values.location) e.location = "Selecciona una ubicación.";
        return e;
    };

    const handleSubmit = async (ev: FormEvent) => {
        ev.preventDefault();
        const found = validate();
        setErrors(found);
        if (Object.keys(found).length > 0) {
            // Lleva el foco al primer campo con error
            const first = document.querySelector<HTMLElement>(".exf-page [aria-invalid='true']");
            first?.focus();
            return;
        }
        setSaving(true);
        try {
            await onSubmit(values);
        } finally {
            setSaving(false);
        }
    };

    const theme = values.topic ? CATEGORY_THEMES[values.topic] : null;
    const PreviewIcon = theme?.Icon;

    const err = (k: keyof ExperienceFormValues) => (errors[k] ? `exf-${k}-error` : undefined);

    const title = isEdit ? "Editar experiencia" : "Nueva experiencia";
    const subtitle = isEdit
        ? "Actualiza la información publicada en el catálogo."
        : "Da de alta una experiencia para el catálogo del museo.";
    const headerAction = isEdit ? "Guardar cambios" : "Crear experiencia";
    const footerAction = isEdit ? "Guardar" : "Crear";

    return (
        <form className="exf-page" onSubmit={handleSubmit} noValidate>
            <header className="exf-head">
                <div>
                    <h1 className="exf-head__title">{title}</h1>
                    <p className="exf-head__subtitle">{subtitle}</p>
                </div>
                <button type="submit" className="exf-btn exf-btn--blue" disabled={saving}>
                    {headerAction}
                </button>
            </header>

            <div className="exf-layout">
                {/* ── Columna principal ── */}
                <div className="exf-col">
                    <h2 className="exf-section-label">Información general</h2>
                    <section className="exf-card">
                        <Field label="Nombre de la experiencia" required htmlFor="exf-name" error={errors.name}>
                            <input
                                id="exf-name"
                                className="exf-control"
                                type="text"
                                placeholder="Escribe el nombre"
                                value={values.name}
                                onChange={(e) => set("name", e.target.value)}
                                aria-invalid={!!errors.name || undefined}
                                aria-describedby={err("name")}
                            />
                        </Field>

                        <Field label="Descripción breve" htmlFor="exf-description">
                            <textarea
                                id="exf-description"
                                className="exf-control exf-control--textarea"
                                placeholder="Describe qué descubrirán los visitantes."
                                value={values.description}
                                onChange={(e) => set("description", e.target.value)}
                                rows={3}
                            />
                        </Field>

                        <div className="exf-row exf-row--2">
                            <Field label="Categoría" required htmlFor="exf-topic" error={errors.topic}>
                                <SelectControl
                                    id="exf-topic"
                                    value={values.topic}
                                    onChange={handleTopic}
                                    placeholder="Selecciona una categoría"
                                    options={Object.entries(CATEGORY_THEMES).map(([k, t]) => ({
                                        value: k,
                                        label: toTitleCase(t.label),
                                    }))}
                                    invalid={!!errors.topic}
                                    describedBy={err("topic")}
                                />
                            </Field>

                            <Field label="Público recomendado" required htmlFor="exf-audiences" error={errors.audiences}>
                                <AudienceSelect
                                    id="exf-audiences"
                                    value={values.audiences}
                                    onChange={(v) => set("audiences", v)}
                                    invalid={!!errors.audiences}
                                    describedBy={err("audiences")}
                                />
                            </Field>
                        </div>
                    </section>

                    <h2 className="exf-section-label">Operación y aforo</h2>
                    <section className="exf-card">
                        <div className="exf-row exf-row--3">
                            <Field label="Duración" required htmlFor="exf-duration" error={errors.durationMinutes}>
                                <div className="exf-suffix">
                                    <input
                                        id="exf-duration"
                                        className="exf-control"
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        placeholder="Ej. 45"
                                        value={values.durationMinutes}
                                        onChange={(e) => set("durationMinutes", e.target.value)}
                                        aria-invalid={!!errors.durationMinutes || undefined}
                                        aria-describedby={err("durationMinutes")}
                                    />
                                    <span className="exf-suffix__text">minutos</span>
                                </div>
                            </Field>

                            <Field label="Cupo máximo" required htmlFor="exf-capacity" error={errors.capacity}>
                                <div className="exf-suffix">
                                    <input
                                        id="exf-capacity"
                                        className="exf-control"
                                        type="number"
                                        min={1}
                                        inputMode="numeric"
                                        placeholder="Ej. 30"
                                        value={values.capacity}
                                        onChange={(e) => set("capacity", e.target.value)}
                                        aria-invalid={!!errors.capacity || undefined}
                                        aria-describedby={err("capacity")}
                                    />
                                    <span className="exf-suffix__text">personas</span>
                                </div>
                            </Field>

                            <Field label="Ubicación" required htmlFor="exf-location" error={errors.location}>
                                <SelectControl
                                    id="exf-location"
                                    value={values.location}
                                    onChange={(v) => set("location", v)}
                                    placeholder="Selecciona una sala"
                                    options={LOCATIONS.map((l) => ({ value: l, label: l }))}
                                    invalid={!!errors.location}
                                    describedBy={err("location")}
                                />
                            </Field>
                        </div>

                        <div className="exf-row exf-row--2">
                            <Field label="Estado" required htmlFor="exf-status">
                                <SelectControl
                                    id="exf-status"
                                    value={values.status}
                                    onChange={(v) => set("status", v as ExperienceStatus)}
                                    options={STATUS_OPTIONS}
                                />
                            </Field>

                            <Field label="Orden en catálogo" htmlFor="exf-order">
                                <input
                                    id="exf-order"
                                    className="exf-control"
                                    type="number"
                                    min={1}
                                    inputMode="numeric"
                                    placeholder="Automático"
                                    value={values.order}
                                    onChange={(e) => set("order", e.target.value)}
                                />
                            </Field>
                        </div>
                    </section>
                </div>

                {/* ── Columna lateral ── */}
                <aside className="exf-col">
                    <h2 className="exf-section-label">Presentación</h2>
                    <section className="exf-card exf-card--side">
                        <h3 className="exf-card__title">Color e identificación</h3>

                        <div
                            className="exf-preview"
                            style={{ backgroundColor: theme ? theme.color : "#E6F0FA" }}
                            aria-hidden="true"
                        >
                            <div className="exf-preview__circle">
                                {PreviewIcon && <PreviewIcon size={30} />}
                            </div>
                        </div>

                        <Field label="Etiqueta visible" htmlFor="exf-tag">
                            <SelectControl
                                id="exf-tag"
                                value={values.tagLabel}
                                onChange={(v) => set("tagLabel", v)}
                                placeholder="Selecciona una etiqueta"
                                options={Object.values(CATEGORY_THEMES).map((t) => ({ value: t.label, label: t.label }))}
                                strong
                            />
                        </Field>

                        <div className="exf-switches">
                            <Toggle
                                checked={values.showInCatalog}
                                onChange={(v) => set("showInCatalog", v)}
                                label="Mostrar en catálogo público"
                            />
                            <Toggle
                                checked={values.availableForBooking}
                                onChange={(v) => set("availableForBooking", v)}
                                label="Disponible para reservaciones"
                            />
                        </div>
                    </section>

                    <section className="exf-card exf-card--side">
                        <h3 className="exf-card__title">Consideraciones</h3>
                        <ul className="exf-notes">
                            <li>La experiencia no tiene costo individual.</li>
                            <li>Se incluye con el boleto general.</li>
                            <li>El cupo participa en el control de aforo.</li>
                        </ul>

                        <div className="exf-modified">
                            <span className="exf-modified__label">Última modificación</span>
                            <strong className="exf-modified__value">
                                {lastModified || "Se registrará al crear"}
                            </strong>
                        </div>

                        <div className="exf-actions">
                            <button type="button" className="exf-link" onClick={onCancel}>
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`exf-btn ${isEdit ? "exf-btn--blue" : "exf-btn--green"}`}
                                disabled={saving}
                            >
                                {footerAction}
                            </button>
                        </div>
                    </section>
                </aside>
            </div>
        </form>
    );
}