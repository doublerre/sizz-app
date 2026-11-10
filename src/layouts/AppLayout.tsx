import { Outlet, NavLink, useNavigate } from "react-router-dom";
import "./AppLayout.css";
import logo from "@/assets/logo_zigzag_main.svg";
import scholarshipLogo from "@/assets/scholarship-logo.png";
import { useAuth } from "@/context/useAuth";
import { useLocation } from "react-router-dom";

const mainMenu = [
  { label: "Inicio", to: "/app/", available: true, color: "var(--brand-blue)" },
  {
    label: "Experiencias",
    to: "/app/experiences",
    available: true,
    color: "var(--brand-green)",
  },
  {
    label: "Visitantes",
    to: "",
    available: false,
    color: "var(--brand-yellow)",
  },
  {
    label: "Reservaciones",
    to: "/app/reservaciones",
    available: true,
    color: "var(--brand-red)",
  },
  { label: "Eventos", to: "/app/eventos", available: true, color: "var(--brand-purple)" },
  { label: "Contenidos", to: "", available: false, color: "var(--brand-blue)" },
  { label: "Reportes", to: "", available: false, color: "var(--brand-green)" },
];

const adminMenu = [
  { label: "Boletos", to: "", available: false, color: "var(--brand-blue)" },
  {
    label: "Becas y guías",
    to: "/app/becas",
    available: true,
    color: "var(--brand-yellow)",
  },
  { label: "Usuarios", to: "/app/users", available: true, color: "var(--brand-yellow)" },
  {
    label: "Configuración",
    to: "",
    available: false,
    color: "var(--brand-red)",
  },
];

const roleLabels: Record<string, string> = { ADMIN: "Administrador", CONTROL: "Control de eventos", SCHOLARSHIP_MANAGER: "Encargado de becas" }

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const scholarships = location.pathname.startsWith("/app/becas");
  const email = user?.sub ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const roleLabel = user ? (roleLabels[user.role] ?? user.role) : "";
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="admin-sidebar-header"><img src={scholarships ? scholarshipLogo : logo} alt="ZigZag" /></div>
        <h2 className="admin-sidebar-group">MENÚ PRINCIPAL</h2>
        {mainMenu.map((item) =>
          item.available && user?.role === "ADMIN" ? <NavLink className="admin-sidebar-item" key={item.label} to={item.to}>
            <span className="admin-sidebar-dot" style={{ backgroundColor: item.color }}></span>{item.label}
          </NavLink> : <span className="admin-sidebar-item admin-sidebar-item-disabled" key={item.label}><span className="admin-sidebar-dot" style={{ backgroundColor: item.color }} />{item.label}</span>)
        }
        <h2 className="admin-sidebar-group">ADMINISTRACIÓN</h2>
        {adminMenu.map((item) =>
          item.available ? <NavLink className="admin-sidebar-item" key={item.label} to={item.to}>
            <span className="admin-sidebar-dot" style={{ backgroundColor: item.color }}></span>{item.label}
          </NavLink> : <span className="admin-sidebar-item admin-sidebar-item-disabled" key={item.label}><span className="admin-sidebar-dot" style={{ backgroundColor: item.color }} />{item.label}</span>
        )}
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">{initials}</div>
          <div><div className="admin-sidebar-user-email" title={email}>{email}</div><div>{roleLabel}</div></div>
        </div>
        <button type="button" className="admin-sidebar-logout" onClick={handleLogout}>Cerrar sesión</button>
      </nav>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
export default AppLayout
