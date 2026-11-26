import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import AccountNavBar from "../../components/AccountNavBar";
import { profileService, type UserProfile } from "../../services/profile.service";
import { User, Mail, Phone, Building, Shield, Camera, Save, X } from "lucide-react";
import "./MyProfilePage.css";
import {Link} from "react-router-dom";

const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    CASHIER: "Taquilla",
    GUIDE: "Guía",
    SCHOLARSHIP_MANAGER: "Gestor Becas",
    USER: "Visitante",
};

export default function MyProfilePage() {
    const { user, logout } = useAuth();

    // Profile data fetched from API
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Form state – initialized from JWT claims, then updated from API
    const [firstName, setFirstName] = useState(user?.given_name ?? "");
    const [lastName, setLastName] = useState(user?.family_name ?? "");
    const [email, setEmail] = useState(user?.email ?? user?.sub ?? "");
    const [phone, setPhone] = useState("");
    const [institution, setInstitution] = useState("");
    const [isEditing, setIsEditing] = useState(false);

    // Fetch full profile from backend
    useEffect(() => {
        if (!user?.uid) return;
        profileService.getMyProfile()
            .then((data) => {
                setProfile(data);
                setFirstName(data.firstName ?? user?.given_name ?? "");
                setLastName(data.lastName ?? user?.family_name ?? "");
                setEmail(data.email ?? user?.email ?? user?.sub ?? "");
                setPhone(data.phone ?? "");
                setInstitution(data.institution ?? "");
            })
            .catch(() => {
                // If the endpoint doesn't exist yet, fall back to JWT claims
            })
            .finally(() => setLoading(false));
    }, [user?.uid, user?.given_name, user?.family_name, user?.email, user?.sub]);

    // Derived values for display
    const userName = (`${firstName} ${lastName}`.trim() || user?.sub) ?? "Usuario";
    const userRole = user ? roleLabels[user.role] ?? user.role : "";
    const initials = userName.slice(0, 2).toUpperCase();

    const handleSave = async () => {
        try {
            await profileService.updateMyProfile({
                firstName,
                lastName,
                phone,
                institution,
            });
            setIsEditing(false);
        } catch {
            // TODO: show error toast
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        // Reset form values to the fetched profile
        if (profile) {
            setFirstName(profile.firstName ?? "");
            setLastName(profile.lastName ?? "");
            setEmail(profile.email ?? "");
            setPhone(profile.phone ?? "");
            setInstitution(profile.institution ?? "");
        } else {
            setFirstName(user?.given_name ?? "");
            setLastName(user?.family_name ?? "");
            setEmail(user?.email ?? user?.sub ?? "");
            setPhone("");
            setInstitution("");
        }
        setIsEditing(false);
    };

    return (
        <div className="my-profile-page">
            <div className="account-page-main">
                <AccountNavBar
                    userName={userName}
                    userRole={userRole}
                    initials={initials}
                    logout={logout}
                    activeNav="perfil"
                />

                <main className="my-profile-content">
                    {/* Page header */}
                    <div className="my-profile-header">
                        <div>
                            <h1 className="my-profile-title">Mi perfil</h1>
                            <p className="my-profile-subtitle">Gestiona tu información personal y de contacto.</p>
                        </div>
                        {!isEditing && (
                            <button
                                type="button"
                                className="btn-edit"
                                onClick={() => setIsEditing(true)}
                            >
                                <Camera size={16} />
                                Editar perfil
                            </button>
                        )}
                    </div>

                    {loading && <p role="status">Cargando datos del perfil…</p>}

                    <div className="my-profile-layout">
                        {/* Profile info card */}
                        <div className="my-profile-main">
                            {/* Avatar section */}
                            <section className="profile-card avatar-section">
                                <div className="avatar-container">
                                    <div className="avatar-circle">{initials}</div>
                                    {isEditing && (
                                        <button type="button" className="avatar-upload-btn" aria-label="Cambiar foto">
                                            <Camera size={18} />
                                        </button>
                                    )}
                                </div>
                                <div className="avatar-info">
                                    <h2 className="avatar-name">{userName}</h2>
                                    <span className="avatar-role-badge">{userRole}</span>
                                </div>
                            </section>

                            {/* Personal information */}
                            <section className="profile-card">
                                <h3 className="profile-card-title">Información personal</h3>
                                <div className="profile-grid">
                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="profile-firstname">
                                            <User size={14} />
                                            Nombre
                                        </label>
                                        <input
                                            id="profile-firstname"
                                            type="text"
                                            className="profile-input"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="profile-lastname">
                                            <User size={14} />
                                            Apellido
                                        </label>
                                        <input
                                            id="profile-lastname"
                                            type="text"
                                            className="profile-input"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="profile-email">
                                            <Mail size={14} />
                                            Correo electrónico
                                        </label>
                                        <input
                                            id="profile-email"
                                            type="email"
                                            className="profile-input"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="profile-phone">
                                            <Phone size={14} />
                                            Teléfono de contacto
                                        </label>
                                        <input
                                            id="profile-phone"
                                            type="tel"
                                            className="profile-input"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-label" htmlFor="profile-institution">
                                            <Building size={14} />
                                            Institución u organización
                                        </label>
                                        <input
                                            id="profile-institution"
                                            type="text"
                                            className="profile-input"
                                            value={institution}
                                            onChange={(e) => setInstitution(e.target.value)}
                                            disabled={!isEditing}
                                        />
                                    </div>
                                    <div className="profile-field">
                                        <label className="profile-label">
                                            <Shield size={14} />
                                            Rol
                                        </label>
                                        <input
                                            type="text"
                                            className="profile-input profile-input--readonly"
                                            value={userRole}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* Action buttons */}
                            {isEditing && (
                                <div className="profile-actions">
                                    <button type="button" className="btn-cancel" onClick={handleCancel}>
                                        <X size={16} />
                                        Cancelar
                                    </button>
                                    <button type="button" className="btn-save" onClick={handleSave}>
                                        <Save size={16} />
                                        Guardar cambios
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <aside className="my-profile-sidebar">
                            <div className="sidebar-card">
                                <h3 className="sidebar-card-title">Resumen de actividad</h3>
                                <div className="activity-summary">
                                    <div className="activity-item">
                                        <span className="activity-value">0</span>
                                        <span className="activity-label">Reservaciones</span>
                                    </div>
                                    <div className="activity-item">
                                        <span className="activity-value">0</span>
                                        <span className="activity-label">Postulaciones</span>
                                    </div>
                                    <div className="activity-item">
                                        <span className="activity-value">0</span>
                                        <span className="activity-label">Eventos asistidos</span>
                                    </div>
                                </div>
                            </div>

                            <div className="sidebar-card">
                                <h3 className="sidebar-card-title">Acciones rápidas</h3>
                                <div className="quick-actions">
                                    {user?.role === "ADMIN" ? (
                                        <Link to="/app" className="quick-action-link">
                                            Panel de administración
                                        </Link>
                                    ) : (
                                        <>
                                            <Link to="/cuenta/nueva-reservacion" className="quick-action-link">
                                                Nueva reservación
                                            </Link>
                                            <Link to="/cuenta/reservaciones" className="quick-action-link">
                                                Ver mis reservaciones
                                            </Link>
                                            <Link to="/cuenta/becas" className="quick-action-link">
                                                Mis postulaciones
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="sidebar-card">
                                <h3 className="sidebar-card-title">Seguridad</h3>
                                <div className="security-actions">
                                    <Link to="/recuperar-contrasena" className="security-link">
                                        Cambiar contraseña
                                    </Link>
                                </div>
                            </div>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}
