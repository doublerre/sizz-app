import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/useAuth";
import {
    Search,
    ChevronDown,
    User,
    UserCheck,
    Mail,
    Ban,
    RefreshCw,
} from "lucide-react";
import { type AdminUser, adminUsersService } from "@/services/admin.users.service";
import "./UserAdminPage.css";

const ROLE_META: Record<string, { label: string; bg: string; color: string; area: string }> = {
    ADMIN: { label: "Administrador", bg: "#eaf4fc", color: "#0868b7", area: "Dirección" },
    GUIDE: { label: "Guía", bg: "#fff7d6", color: "#8b6b00", area: "Operación" },
    CASHIER: { label: "Taquilla", bg: "#edf8e9", color: "#398a1e", area: "Taquilla" },
    SCHOLARSHIP_MANAGER: { label: "Gestor Becas", bg: "#edebfa", color: "#6554c0", area: "Educación" },
    CONTROL: { label: "Control Acceso", bg: "#f1f3f5", color: "#334e68", area: "Seguridad" },
    REPORT: { label: "Reportes", bg: "#fdecee", color: "#c32435", area: "Estadística" },
    USER: { label: "Visitante", bg: "#f4f8fb", color: "#708096", area: "Público" },
};

function SummaryIcon({ type, color }: { type: string; bg: string; color: string }) {
    switch (type) {
        case "users":
            return <User size={24} color={color} />;
        case "active":
            return <UserCheck size={21} color={color} />;
        case "mail":
            return <Mail size={16} color={color} />;
        case "suspended":
            return <Ban size={16} color={color} />;
        default:
            return null;
    }
}

export default function UserAdminPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user: currentUser } = useAuth();

    const [usersList, setUsersList] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const loadUsers = async () => {
        setLoading(true);
        try {
            const users = await adminUsersService.listUsers();
            setUsersList(users);
        } catch (err) {
            console.error('[UserAdminPage] Error al cargar usuarios:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar usuarios al montar y al volver del formulario de edición
    useEffect(() => {
        loadUsers();
    }, [location.key]);

    // Filtros en memoria sobre los usuarios cargados
    const filteredUsers = usersList.filter((user) => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const term = searchTerm.trim().toLowerCase();

        const matchesSearch = !term || fullName.includes(term) || email.includes(term);
        const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
        const matchesStatus =
            statusFilter === "ALL" ||
            (statusFilter === "ACTIVE" && user.isActive) ||
            (statusFilter === "INACTIVE" && !user.isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handleClearFilters = () => {
        setSearchTerm("");
        setRoleFilter("ALL");
        setStatusFilter("ALL");
        setCurrentPage(1);
    };

    // Cálculos de resumen
    const totalCount = usersList.length;
    const activeCount = usersList.filter((u) => u.isActive).length;
    const pendingCount = usersList.filter((u) => !u.isActive).length;
    const adminCount = usersList.filter((u) => u.role === "ADMIN").length;

    const summaryCards = [
        {
            icon: "users",
            label: "Usuarios totales",
            value: loading ? "..." : String(totalCount),
            iconBg: "#eaf4fc",
            iconColor: "#0868b7",
        },
        {
            icon: "active",
            label: "Cuentas activas",
            value: loading ? "..." : String(activeCount),
            iconBg: "#edf8e9",
            iconColor: "#55b82c",
        },
        {
            icon: "mail",
            label: "Por verificar",
            value: loading ? "..." : String(pendingCount),
            iconBg: "#fff7d6",
            iconColor: "#f0b500",
        },
        {
            icon: "suspended",
            label: "Administradores",
            value: loading ? "..." : String(adminCount),
            iconBg: "#edebfa",
            iconColor: "#6554c0",
        },
    ];

    const formatDate = (isoString?: string) => {
        if (!isoString) return "Sin registro";
        try {
            return new Date(isoString).toLocaleDateString("es-MX", {
                day: "numeric",
                month: "short",
                year: "numeric",
            });
        } catch {
            return isoString;
        }
    };

    return (
        <div className="user-admin">
            {/* Header */}
            <header className="user-admin__header">
                <div className="user-admin__header-text">
                    <h1 className="user-admin__title">Administración de usuarios</h1>
                    <p className="user-admin__subtitle">
                        Gestiona accesos, roles y estado de las cuentas del sistema.
                    </p>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                        type="button"
                        className="user-admin__refresh-btn"
                        onClick={loadUsers}
                        title="Actualizar lista"
                        style={{
                            background: "#ffffff",
                            border: "1px solid #d9e2ec",
                            borderRadius: "8px",
                            padding: "0 0.8rem",
                            height: "48px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#708096"
                        }}
                    >
                        <RefreshCw size={18} className={loading ? "spin" : ""} />
                    </button>
                    <button
                        type="button"
                        className="user-admin__new-btn"
                        onClick={() => navigate("/app/users/new")}
                    >
                        + Nuevo usuario
                    </button>
                </div>
            </header>

            <main className="user-admin__content">
                {/* Summary Cards */}
                <section className="user-admin__summary" aria-label="Resumen de usuarios">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                            <article key={i} className="user-admin__card user-admin__card--skeleton">
                                <div className="user-admin__skeleton-icon user-admin__skeleton" />
                                <div className="user-admin__skeleton-card-text">
                                    <div className="user-admin__skeleton-label user-admin__skeleton" />
                                    <div className="user-admin__skeleton-value user-admin__skeleton" />
                                </div>
                            </article>
                        ))
                        : summaryCards.map((card) => (
                            <article key={card.label} className="user-admin__card">
                                <div
                                    className="user-admin__card-icon"
                                    style={{ backgroundColor: card.iconBg }}
                                >
                                    <SummaryIcon type={card.icon} bg={card.iconBg} color={card.iconColor} />
                                </div>
                                <div>
                                    <span className="user-admin__card-label">{card.label}</span>
                                    <div className="user-admin__card-value">{card.value}</div>
                                </div>
                            </article>
                        ))}
                </section>

                {/* Filters */}
                <section className="user-admin__filters">
                    <div className="user-admin__search">
                        <Search size={16} color="#708096" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o correo..."
                            className="user-admin__search-input"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>

                    <div className="user-admin__filter-group">
                        <select
                            className="user-admin__select"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="ALL">Todos los roles</option>
                            <option value="ADMIN">Administrador</option>
                            <option value="GUIDE">Guía</option>
                            <option value="CASHIER">Taquilla</option>
                            <option value="SCHOLARSHIP_MANAGER">Gestor Becas</option>
                            <option value="CONTROL">Control Acceso</option>
                            <option value="REPORT">Reportes</option>
                            <option value="USER">Visitante</option>
                        </select>
                        <ChevronDown size={12} color="#708096" className="user-admin__select-icon" />
                    </div>

                    <div className="user-admin__filter-group">
                        <select
                            className="user-admin__select"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="ALL">Todos los estados</option>
                            <option value="ACTIVE">Activo</option>
                            <option value="INACTIVE">Por verificar / Inactivo</option>
                        </select>
                        <ChevronDown size={12} color="#708096" className="user-admin__select-icon" />
                    </div>

                    {(searchTerm || roleFilter !== "ALL" || statusFilter !== "ALL") && (
                        <button type="button" className="user-admin__clear" onClick={handleClearFilters}>
                            Limpiar
                        </button>
                    )}
                </section>

                {/* Users Table */}
                <section className="user-admin__table-section">
                    <div className="user-admin__table-header">
                        <div>
                            <h2 className="user-admin__table-title">Usuarios</h2>
                            <p className="user-admin__table-count">
                                {loading
                                    ? "Cargando registros..."
                                    : `${filteredUsers.length} registros encontrados`}
                            </p>
                        </div>
                    </div>

                    <div className="user-admin__table">
                        <div className="user-admin__table-head">
                            <span className="user-admin__col-user">USUARIO</span>
                            <span className="user-admin__col-role">ROL</span>
                            <span className="user-admin__col-area">ÁREA</span>
                            <span className="user-admin__col-status">ESTADO</span>
                            <span className="user-admin__col-access">REGISTRADO</span>
                            <span className="user-admin__col-actions">ACCIONES</span>
                        </div>

                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="user-admin__row--skeleton">
                                    <div className="user-admin__skeleton-user">
                                        <div className="user-admin__skeleton-avatar user-admin__skeleton" />
                                        <div className="user-admin__skeleton-user-text">
                                            <div className="user-admin__skeleton-name user-admin__skeleton" />
                                            <div className="user-admin__skeleton-email user-admin__skeleton" />
                                        </div>
                                    </div>
                                    <div className="user-admin__skeleton-badge user-admin__skeleton" />
                                    <div className="user-admin__skeleton-text user-admin__skeleton" />
                                    <div className="user-admin__skeleton-badge user-admin__skeleton" />
                                    <div className="user-admin__skeleton-text user-admin__skeleton" />
                                    <div className="user-admin__skeleton-actions user-admin__skeleton" />
                                </div>
                            ))
                        ) : paginatedUsers.length === 0 ? (
                            <div style={{ padding: "2.5rem", textAlign: "center", color: "#708096" }}>
                                No se encontraron usuarios con los criterios de búsqueda.
                            </div>
                        ) : (
                            paginatedUsers.map((user) => {
                                const initials =
                                    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase() || "U";
                                const roleMeta = ROLE_META[user.role] || {
                                    label: user.role,
                                    bg: "#f1f3f5",
                                    color: "#10243a",
                                    area: "General",
                                };

                                return (
                                    <div key={user.id} className="user-admin__row">
                                        <div className="user-admin__col-user">
                                            <div
                                                className="user-admin__avatar"
                                                style={{
                                                    backgroundColor: roleMeta.bg,
                                                    color: roleMeta.color,
                                                }}
                                            >
                                                {initials}
                                            </div>
                                            <div>
                                                <div className="user-admin__user-name">
                                                    {`${user.firstName} ${user.lastName}`.trim() || user.email}
                                                </div>
                                                <div className="user-admin__user-email">{user.email}</div>
                                            </div>
                                        </div>

                                        <div className="user-admin__col-role">
                                            <span
                                                className="user-admin__badge"
                                                style={{
                                                    backgroundColor: roleMeta.bg,
                                                    color: roleMeta.color,
                                                }}
                                            >
                                                {roleMeta.label}
                                            </span>
                                        </div>

                                        <div className="user-admin__col-area">{roleMeta.area}</div>

                                        <div className="user-admin__col-status">
                                            <span
                                                className="user-admin__badge"
                                                style={{
                                                    backgroundColor: "#edf8e9",
                                                    color: "#398a1e",
                                                }}
                                            >
                                                Activo
                                            </span>
                                        </div>

                                        <div className="user-admin__col-access">
                                            <div className="user-admin__access-time">
                                                {formatDate(user.createdAt)}
                                            </div>
                                        </div>

                                        <div className="user-admin__col-actions">
                                            {user.id === currentUser?.uid ? (
                                                <span
                                                    style={{
                                                        fontSize: "0.72rem",
                                                        color: "#708096",
                                                        textAlign: "right",
                                                        display: "block",
                                                        whiteSpace: "nowrap"
                                                    }}
                                                    title="No se puede modificar la cuenta actual"
                                                >
                                                    Cuenta actual
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="user-admin__actions-btn"
                                                    aria-label={`Opciones para ${user.firstName}`}
                                                    onClick={() => navigate(`/app/users/${user.id}/edit`)}
                                                    title="Editar usuario"
                                                >
                                                    •••
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {!loading && filteredUsers.length > 0 && (
                        <footer className="user-admin__pagination">
                            <span className="user-admin__pagination-info">
                                Mostrando {(currentPage - 1) * pageSize + 1}–
                                {Math.min(currentPage * pageSize, filteredUsers.length)} de{" "}
                                {filteredUsers.length} usuarios
                            </span>
                            <div className="user-admin__pagination-buttons">
                                <button
                                    type="button"
                                    className={`user-admin__page-btn ${
                                        currentPage <= 1 ? "user-admin__page-btn--disabled" : ""
                                    }`}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    aria-label="Página anterior"
                                >
                                    ‹
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        type="button"
                                        className={`user-admin__page-btn ${
                                            pageNum === currentPage ? "user-admin__page-btn--active" : ""
                                        }`}
                                        onClick={() => setCurrentPage(pageNum)}
                                        aria-label={`Página ${pageNum}`}
                                    >
                                        {pageNum}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className={`user-admin__page-btn ${
                                        currentPage >= totalPages ? "user-admin__page-btn--disabled" : ""
                                    }`}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    aria-label="Página siguiente"
                                >
                                    ›
                                </button>
                            </div>
                        </footer>
                    )}
                </section>
            </main>
        </div>
    );
}
