import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import logo from "../assets/logo_zigzag_main.png";
import "./PublicNavigation.css";

const links = [
  ["/", "Inicio"],
  ["/eventos", "Eventos"],
  ["/cuenta/reservaciones", "Reservaciones"],
  ["/becas", "Becas y guías"],
];

export default function PublicNavigation() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const account =
    user?.role === "ADMIN" || user?.role === "SCHOLARSHIP_MANAGER"
      ? "/app/becas"
      : "/cuenta/becas";
  return (
    <header className="public-navigation">
      <Link to="/" aria-label="Zigzag, inicio" onClick={() => setOpen(false)}>
        <img src={logo} alt="Zigzag" />
      </Link>
      <button
        className="public-navigation-toggle"
        aria-expanded={open}
        aria-controls="public-navigation-links"
        onClick={() => setOpen(!open)}
      >
        {open ? "Cerrar menú" : "Menú"}
      </button>
      <nav
        id="public-navigation-links"
        className={open ? "open" : ""}
        aria-label="Navegación principal"
      >
        {links.map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={() => setOpen(false)}
          >
            {label}
          </NavLink>
        ))}
        {user ? (
          <>
            <Link to={account} onClick={() => setOpen(false)}>
              Mi cuenta
            </Link>
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link to="/login" onClick={() => setOpen(false)}>
            Iniciar sesión
          </Link>
        )}
        <Link
          className="public-navigation-action"
          to="/cuenta/reservaciones"
          onClick={() => setOpen(false)}
        >
          Reservar visita
        </Link>
      </nav>
    </header>
  );
}
