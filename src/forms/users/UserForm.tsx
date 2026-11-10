import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminUsersService, type AdminUser } from "@/services/admin.users.service.ts";
import {
    User,
    Mail,
    Shield,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Check,
    ArrowLeft,
    AlertCircle,
    Info,
    CheckCircle2
} from "lucide-react";
import "./UserForm.css";

export type SystemRole =
    | "ADMIN"
    | "USER"
    | "GUIDE"
    | "CASHIER"
    | "SCHOLARSHIP_MANAGER"
    | "CONTROL"
    | "REPORT";

export interface UserFormValues {
    firstName: string;
    lastName: string;
    email: string;
    role: SystemRole;
    password: string;
    confirmPassword: string;
    sendVerificationEmail: boolean;
    isActiveImmediately: boolean;
}

export const ROLE_DETAILS: Record<SystemRole, { label: string; description: string; badgeBg: string; badgeColor: string }> = {
    ADMIN: {
        label: "Administrador",
        description: "Acceso total al sistema, catálogos, configuraciones y usuarios.",
        badgeBg: "#eaf4fc",
        badgeColor: "#0868b7",
    },
    GUIDE: {
        label: "Guía",
        description: "Gestión de recorridos, experiencias asignadas y asistencias.",
        badgeBg: "#fff7d6",
        badgeColor: "#8b6b00",
    },
    CASHIER: {
        label: "Taquilla / Cajero",
        description: "Venta de boletos, recepción de visitantes y cobros en taquilla.",
        badgeBg: "#edf8e9",
        badgeColor: "#398a1e",
    },
    SCHOLARSHIP_MANAGER: {
        label: "Gestor de Becas",
        description: "Administración del programa de becas, convocatorias y becarios.",
        badgeBg: "#edebfa",
        badgeColor: "#6554c0",
    },
    CONTROL: {
        label: "Control de Acceso",
        description: "Validación de boletos, torniquetes y monitoreo de aforo.",
        badgeBg: "#f1f3f5",
        badgeColor: "#334e68",
    },
    REPORT: {
        label: "Reportes / Consulta",
        description: "Acceso a tableros analíticos, reportes y estadísticas.",
        badgeBg: "#fdecee",
        badgeColor: "#c32435",
    },
    USER: {
        label: "Visitante / Público",
        description: "Cuenta básica para reservaciones ciudadanas y compra en línea.",
        badgeBg: "#f4f8fb",
        badgeColor: "#708096",
    },
};

export const INITIAL_USER_VALUES: UserFormValues = {
    firstName: "",
    lastName: "",
    email: "",
    role: "GUIDE",
    password: "",
    confirmPassword: "",
    sendVerificationEmail: true,
    isActiveImmediately: false,
};

interface UserFormProps {
    mode?: "create" | "edit";
    initialValues?: Partial<UserFormValues>;
    onSubmit?: (values: UserFormValues) => Promise<void> | void;
    onCancel?: () => void;
}

export default function UserForm({
    mode = "create",
    initialValues,
    onSubmit,
    onCancel,
}: UserFormProps) {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [values, setValues] = useState<UserFormValues>({
        ...INITIAL_USER_VALUES,
        ...initialValues,
    });
    const [loadingUser, setLoadingUser] = useState(false);

    // Cargar datos del usuario en modo edición
    useEffect(() => {
        if (mode !== "edit" || !id || initialValues) return;

        let cancelled = false;
        setLoadingUser(true);

        adminUsersService.getUserById(id)
            .then((user: AdminUser) => {
                if (cancelled) return;
                setValues((prev) => ({
                    ...prev,
                    firstName: user.firstName || "",
                    lastName: user.lastName || "",
                    email: user.email || "",
                    role: user.role as SystemRole,
                    isActiveImmediately: user.isActive,
                }));
            })
            .catch((err) => {
                if (cancelled) return;
                console.error("Error al cargar usuario:", err);
            })
            .finally(() => {
                if (!cancelled) setLoadingUser(false);
            });

        return () => {
            cancelled = true;
        };
    }, [mode, id, initialValues]);

    const [errors, setErrors] = useState<Partial<Record<keyof UserFormValues, string>>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const isEdit = mode === "edit";

    const handleChange = <K extends keyof UserFormValues>(field: K, value: UserFormValues[K]) => {
        setValues((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[field];
                return updated;
            });
        }
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        } else {
            navigate("/app/users");
        }
    };

    const generateRandomPassword = () => {
        const charset = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*";
        let generated = "";
        for (let i = 0; i < 12; i++) {
            generated += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setValues((prev) => ({
            ...prev,
            password: generated,
            confirmPassword: generated,
        }));
        setShowPassword(true);
        if (errors.password || errors.confirmPassword) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next.password;
                delete next.confirmPassword;
                return next;
            });
        }
    };

    const validate = (): boolean => {
        const nextErrors: Partial<Record<keyof UserFormValues, string>> = {};

        if (!values.firstName.trim()) {
            nextErrors.firstName = "El nombre es obligatorio.";
        }
        if (!values.lastName.trim()) {
            nextErrors.lastName = "Los apellidos son obligatorios.";
        }
        if (!values.email.trim()) {
            nextErrors.email = "El correo electrónico es obligatorio.";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
            nextErrors.email = "Ingresa un correo electrónico válido.";
        }

        if (!isEdit) {
            if (!values.password) {
                nextErrors.password = "La contraseña es obligatoria.";
            } else if (values.password.length < 8) {
                nextErrors.password = "La contraseña debe tener al menos 8 caracteres.";
            }

            if (values.password !== values.confirmPassword) {
                nextErrors.confirmPassword = "Las contraseñas no coinciden.";
            }
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            if (onSubmit) {
                await onSubmit(values);
            } else if (isEdit && id) {
                // Modo edición: actualizar usuario existente
                await adminUsersService.updateUser(id, {
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    role: values.role,
                    isActive: values.isActiveImmediately,
                });
            } else {
                // Modo creación
                await adminUsersService.createUser({
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    password: values.password,
                    role: values.role,
                    sendVerificationEmail: values.sendVerificationEmail,
                    isActiveImmediately: values.isActiveImmediately
                });
            }
            setSubmitSuccess(true);
            setTimeout(() => {
                handleCancel();
            }, 1200);
        } catch (err: unknown) {
            console.error("Error al guardar usuario:", err);
            const msg = err instanceof Error ? err.message : "No se pudo guardar el usuario. Revisa los datos ingresados.";
            setSubmitError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedRoleMeta = ROLE_DETAILS[values.role];

    if (loadingUser) {
        return (
            <div className="usr-form-page">
                <div style={{ padding: "3rem", textAlign: "center", color: "#708096" }}>
                    Cargando datos del usuario...
                </div>
            </div>
        );
    }

    return (
        <form className="usr-form-page" onSubmit={handleSubmit} noValidate>
            {/* ── Encabezado ── */}
            <header className="usr-form-head">
                <div className="usr-form-head__left">
                    <button
                        type="button"
                        className="usr-form-back-btn"
                        onClick={handleCancel}
                        title="Volver a la lista de usuarios"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="usr-form-head__title">
                            {isEdit ? "Editar usuario" : "Nuevo usuario"}
                        </h1>
                        <p className="usr-form-head__subtitle">
                            {isEdit
                                ? `Editando: ${values.email || "Usuario"}`
                                : "Registra un nuevo usuario del sistema y define sus credenciales y permisos."}
                        </p>
                    </div>
                </div>

                <div className="usr-form-head__actions">
                    <button
                        type="button"
                        className="usr-form-link"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className={`usr-form-btn ${isEdit ? "usr-form-btn--blue" : "usr-form-btn--green"}`}
                        disabled={isSubmitting || submitSuccess}
                    >
                        {isSubmitting ? (
                            "Guardando..."
                        ) : submitSuccess ? (
                            <>
                                <Check size={16} /> Guardado
                            </>
                        ) : isEdit ? (
                            "Guardar cambios"
                        ) : (
                            "+ Crear usuario"
                        )}
                    </button>
                </div>
            </header>

            {/* Mensajes de estado */}
            {submitError && (
                <div className="usr-form-alert usr-form-alert--error" role="alert">
                    <AlertCircle size={18} />
                    <span>{submitError}</span>
                </div>
            )}

            {submitSuccess && (
                <div className="usr-form-alert usr-form-alert--success" role="status">
                    <CheckCircle2 size={18} />
                    <span>Usuario registrado con éxito. Redirigiendo a la lista...</span>
                </div>
            )}

            {/* ── Grid Principal / Lateral ── */}
            <div className="usr-form-layout">
                {/* ── Columna Principal ── */}
                <div className="usr-form-col usr-form-col--main">
                    {/* Tarjeta 1: Información Personal */}
                    <section className="usr-form-card">
                        <div className="usr-form-card__header">
                            <div className="usr-form-card__icon-box">
                                <User size={20} color="#0868b7" />
                            </div>
                            <div>
                                <h2 className="usr-form-card__title">Información personal</h2>
                                <p className="usr-form-card__subtitle">
                                    Nombre completo y datos de contacto oficial.
                                </p>
                            </div>
                        </div>

                        <div className="usr-form-grid-2">
                            <div className="usr-form-field">
                                <label className="usr-form-label" htmlFor="usr-firstname">
                                    Nombre(s) <span className="usr-form-required">*</span>
                                </label>
                                <input
                                    id="usr-firstname"
                                    type="text"
                                    className={`usr-form-input ${errors.firstName ? "usr-form-input--error" : ""}`}
                                    placeholder="Ej. Roberto"
                                    value={values.firstName}
                                    onChange={(e) => handleChange("firstName", e.target.value)}
                                    disabled={isSubmitting}
                                />
                                {errors.firstName && (
                                    <span className="usr-form-field-error">{errors.firstName}</span>
                                )}
                            </div>

                            <div className="usr-form-field">
                                <label className="usr-form-label" htmlFor="usr-lastname">
                                    Apellidos <span className="usr-form-required">*</span>
                                </label>
                                <input
                                    id="usr-lastname"
                                    type="text"
                                    className={`usr-form-input ${errors.lastName ? "usr-form-input--error" : ""}`}
                                    placeholder="Ej. Pérez Márquez"
                                    value={values.lastName}
                                    onChange={(e) => handleChange("lastName", e.target.value)}
                                    disabled={isSubmitting}
                                />
                                {errors.lastName && (
                                    <span className="usr-form-field-error">{errors.lastName}</span>
                                )}
                            </div>
                        </div>

                        <div className="usr-form-field">
                            <label className="usr-form-label" htmlFor="usr-email">
                                Correo electrónico institucional o personal <span className="usr-form-required">*</span>
                            </label>
                            <div className="usr-form-input-wrapper">
                                <Mail size={16} className="usr-form-input-icon" />
                                <input
                                    id="usr-email"
                                    type="email"
                                    className={`usr-form-input usr-form-input--with-icon ${errors.email ? "usr-form-input--error" : ""}`}
                                    placeholder="nombre.apellido@zigzag.gob.mx"
                                    value={values.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    disabled={isSubmitting}
                                />
                            </div>
                            {errors.email && (
                                <span className="usr-form-field-error">{errors.email}</span>
                            )}
                            <span className="usr-form-help">
                                A este correo se enviará el enlace o código de activación de cuenta.
                            </span>
                        </div>
                    </section>

                    {/* Tarjeta 2: Rol y Perfil de Acceso */}
                    <section className="usr-form-card">
                        <div className="usr-form-card__header">
                            <div className="usr-form-card__icon-box">
                                <Shield size={20} color="#0868b7" />
                            </div>
                            <div>
                                <h2 className="usr-form-card__title">Rol en el sistema</h2>
                                <p className="usr-form-card__subtitle">
                                    Determina los permisos, áreas y módulos a los que tendrá acceso.
                                </p>
                            </div>
                        </div>

                        <div className="usr-form-role-grid">
                            {(Object.keys(ROLE_DETAILS) as SystemRole[]).map((r) => {
                                const isSelected = values.role === r;
                                const meta = ROLE_DETAILS[r];
                                return (
                                    <div
                                        key={r}
                                        className={`usr-form-role-card ${isSelected ? "usr-form-role-card--active" : ""}`}
                                        onClick={() => handleChange("role", r)}
                                        role="radio"
                                        aria-checked={isSelected}
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === " " || e.key === "Enter") {
                                                e.preventDefault();
                                                handleChange("role", r);
                                            }
                                        }}
                                    >
                                        <div className="usr-form-role-card__top">
                                            <span
                                                className="usr-form-role-badge"
                                                style={{ backgroundColor: meta.badgeBg, color: meta.badgeColor }}
                                            >
                                                {meta.label}
                                            </span>
                                            {isSelected && (
                                                <div className="usr-form-role-check">
                                                    <Check size={14} color="#ffffff" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="usr-form-role-desc">{meta.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Tarjeta 3: Contraseña inicial (solo creación o restablecimiento) */}
                    {!isEdit && (
                        <section className="usr-form-card">
                            <div className="usr-form-card__header">
                                <div className="usr-form-card__icon-box">
                                    <Lock size={20} color="#0868b7" />
                                </div>
                                <div className="usr-form-card__header-flex">
                                    <div>
                                        <h2 className="usr-form-card__title">Contraseña inicial</h2>
                                        <p className="usr-form-card__subtitle">
                                            Define la clave de primer acceso o genera una aleatoria.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="usr-form-gen-btn"
                                        onClick={generateRandomPassword}
                                        title="Generar contraseña segura"
                                    >
                                        <RefreshCw size={14} />
                                        <span>Generar segura</span>
                                    </button>
                                </div>
                            </div>

                            <div className="usr-form-grid-2">
                                <div className="usr-form-field">
                                    <label className="usr-form-label" htmlFor="usr-password">
                                        Contraseña <span className="usr-form-required">*</span>
                                    </label>
                                    <div className="usr-form-input-wrapper">
                                        <input
                                            id="usr-password"
                                            type={showPassword ? "text" : "password"}
                                            className={`usr-form-input usr-form-input--with-action ${errors.password ? "usr-form-input--error" : ""}`}
                                            placeholder="Mínimo 8 caracteres"
                                            value={values.password}
                                            onChange={(e) => handleChange("password", e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="usr-form-eye-btn"
                                            onClick={() => setShowPassword(!showPassword)}
                                            aria-label={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <span className="usr-form-field-error">{errors.password}</span>
                                    )}
                                </div>

                                <div className="usr-form-field">
                                    <label className="usr-form-label" htmlFor="usr-confirm-password">
                                        Confirmar contraseña <span className="usr-form-required">*</span>
                                    </label>
                                    <div className="usr-form-input-wrapper">
                                        <input
                                            id="usr-confirm-password"
                                            type={showConfirmPassword ? "text" : "password"}
                                            className={`usr-form-input usr-form-input--with-action ${errors.confirmPassword ? "usr-form-input--error" : ""}`}
                                            placeholder="Repite la contraseña"
                                            value={values.confirmPassword}
                                            onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                            disabled={isSubmitting}
                                        />
                                        <button
                                            type="button"
                                            className="usr-form-eye-btn"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            aria-label={showConfirmPassword ? "Ocultar confirmación" : "Ver confirmación"}
                                        >
                                            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <span className="usr-form-field-error">{errors.confirmPassword}</span>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                {/* ── Columna Lateral ── */}
                <aside className="usr-form-col usr-form-col--side">
                    {/* Resumen del perfil */}
                    <section className="usr-form-card usr-form-card--side">
                        <h3 className="usr-form-side-title">Resumen de cuenta</h3>

                        <div className="usr-form-avatar-preview">
                            <div
                                className="usr-form-avatar-circle"
                                style={{ backgroundColor: selectedRoleMeta.badgeBg, color: selectedRoleMeta.badgeColor }}
                            >
                                {values.firstName || values.lastName
                                    ? `${values.firstName.charAt(0)}${values.lastName.charAt(0)}`.toUpperCase()
                                    : "NU"}
                            </div>
                            <div className="usr-form-avatar-meta">
                                <strong className="usr-form-avatar-name">
                                    {values.firstName || values.lastName
                                        ? `${values.firstName} ${values.lastName}`.trim()
                                        : "Nombre del usuario"}
                                </strong>
                                <span className="usr-form-avatar-email">
                                    {values.email || "correo@ejemplo.com"}
                                </span>
                            </div>
                        </div>

                        <div className="usr-form-side-row">
                            <span className="usr-form-side-label">Rol seleccionado</span>
                            <span
                                className="usr-form-role-badge"
                                style={{ backgroundColor: selectedRoleMeta.badgeBg, color: selectedRoleMeta.badgeColor }}
                            >
                                {selectedRoleMeta.label}
                            </span>
                        </div>

                        <div className="usr-form-side-row">
                            <span className="usr-form-side-label">Estado inicial</span>
                            <span className="usr-form-status-tag usr-form-status-tag--pending">
                                {values.isActiveImmediately ? "Activo directo" : "Inactivo (Por verificar)"}
                            </span>
                        </div>
                    </section>

                    {/* Flujo de Activación y Notificaciones */}
                    <section className="usr-form-card usr-form-card--side">
                        <h3 className="usr-form-side-title">Flujo de activación</h3>

                        <label className="usr-form-switch-row">
                            <div className="usr-form-switch-text">
                                <strong>Enviar correo con código de verificación</strong>
                                <span>El usuario recibirá un código de 6 dígitos para validar su cuenta.</span>
                            </div>
                            <input
                                type="checkbox"
                                className="usr-form-toggle"
                                checked={values.sendVerificationEmail}
                                onChange={(e) => handleChange("sendVerificationEmail", e.target.checked)}
                            />
                        </label>

                        <label className="usr-form-switch-row">
                            <div className="usr-form-switch-text">
                                <strong>Activar cuenta de inmediato</strong>
                                <span>Omite la verificación previa (el usuario ya queda con isActive=true).</span>
                            </div>
                            <input
                                type="checkbox"
                                className="usr-form-toggle"
                                checked={values.isActiveImmediately}
                                onChange={(e) => handleChange("isActiveImmediately", e.target.checked)}
                            />
                        </label>

                        <div className="usr-form-notice">
                            <Info size={16} className="usr-form-notice-icon" />
                            <p>
                                La cuenta se crea con estado inactivo por seguridad. Si el usuario no verifica su código de inmediato, podrá solicitar uno nuevo al intentar iniciar sesión.
                            </p>
                        </div>

                        {/* Botones al pie de la columna lateral */}
                        <div className="usr-form-side-actions">
                            <button
                                type="button"
                                className="usr-form-link"
                                onClick={handleCancel}
                                disabled={isSubmitting}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className={`usr-form-btn ${isEdit ? "usr-form-btn--blue" : "usr-form-btn--green"}`}
                                disabled={isSubmitting || submitSuccess}
                            >
                                {isSubmitting ? "Guardando..." : isEdit ? "Guardar cambios" : "+ Crear usuario"}
                            </button>
                        </div>
                    </section>
                </aside>
            </div>
        </form>
    );
}
