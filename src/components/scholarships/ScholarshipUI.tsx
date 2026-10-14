import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { statusLabels } from "../../data/scholarships";
import logo from "../../assets/scholarship-logo.png";
import "./scholarships.css";
import PublicNavigation from "../PublicNavigation";

export function ScholarshipButton({
  tone = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: "primary" | "secondary" | "success" | "danger" | "yellow";
}) {
  return (
    <button
      type="button"
      {...props}
      className={`sch-button sch-button-${tone} ${className}`}
    />
  );
}
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`sch-badge sch-status-${status.toLowerCase()}`}>
      {statusLabels[status] ?? status}
    </span>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return children ? (
    <p
      className={`sch-notice ${error ? "sch-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </p>
  ) : null;
}
export function LoadState({
  loading,
  data,
  error,
  retry,
}: {
  loading: boolean;
  data?: unknown;
  error: string;
  retry: () => void;
}) {
  return (
    <>
      {loading && data == null && <Notice>Cargando…</Notice>}
      {error && (
        <>
          <ScholarshipButton tone="secondary" onClick={retry}>
            Reintentar
          </ScholarshipButton>
        </>
      )}
    </>
  );
}
export function ScholarshipField({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`sch-field ${wide ? "sch-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function ScholarshipHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  return (
    <header className="sch-admin-header">
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      {children}
    </header>
  );
}
export function AdminScholarshipNav({ callId }: { callId?: string }) {
  const { user } = useAuth();
  return (
    <nav className="sch-tabs" aria-label="Administración de becas">
      <div className="sch-nav-group" role="group" aria-label="Gestión de becas">
        <NavLink to="/app/becas" end>
          Convocatorias
        </NavLink>
        <NavLink to="/app/becas/formularios">Formularios y exámenes</NavLink>
        <NavLink to="/app/becas/catalogos">Periodos y categorías</NavLink>
      </div>
      {callId && (
        <div className="sch-nav-group" role="group" aria-label="Convocatoria">
          <NavLink to={`/app/becas/${callId}/editar`}>Configuración</NavLink>
          <NavLink to={`/app/becas/${callId}/postulaciones`}>
            Postulaciones
          </NavLink>
          {user?.role === "ADMIN" && (
            <>
              <NavLink to={`/app/becas/${callId}/evaluacion`}>
                Evaluación
              </NavLink>
              <NavLink to={`/app/becas/${callId}/horas`}>Horas</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
export function ScholarshipPublicLayout() {
  return (
    <div className="sch-app">
      <PublicNavigation />
      <Outlet />
      <footer className="sch-footer">
        <div>
          <img src={logo} alt="Zigzag" />
          <p>Centro Interactivo de Ciencia y Tecnología Zigzag · Zacatecas</p>
          <p>Consulta convocatorias, postulaciones y actividades del SIZZ.</p>
        </div>
        <nav aria-label="Explora">
          <strong>EXPLORA</strong>
          <Link to="/eventos">Eventos</Link>
          <Link to="/becas">Convocatorias</Link>
          <Link to="/cuenta/reservaciones">Reservaciones</Link>
        </nav>
        <nav aria-label="Mi cuenta">
          <strong>MI CUENTA</strong>
          <Link to="/cuenta/becas">Mis postulaciones</Link>
          <Link to="/cuenta/becas/horas">Mis horas</Link>
        </nav>
        <Link className="sch-button sch-button-yellow" to="/eventos">
          Planear mi visita
        </Link>
        <small>
          © {new Date().getFullYear()} Zigzag Zacatecas · Sistema Integral
          Zigzag
        </small>
      </footer>
    </div>
  );
}
export function GuideLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="sch-app sch-guide-layout">
      <aside className="sch-guide-sidebar">
        <Link to="/">
          <img src={logo} alt="Zigzag" />
        </Link>
        <p>PORTAL DE GUÍAS</p>
        <nav aria-label="Portal de guías">
          <NavLink to="/cuenta/becas" end>
            Inicio
          </NavLink>
          <NavLink to="/cuenta/becas/horas">Mis horas</NavLink>
          <Link to="/becas">Convocatorias</Link>
        </nav>
        <div className="sch-guide-user">
          <strong>{user?.sub}</strong>
          <span>Guía Zigzag</span>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
