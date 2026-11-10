import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo_zigzag_main.svg";
import { useAuth } from "@/context/useAuth";
import "./Navbar.css";

//poner true cuando la ruta este disponible
const navLinks = [
    { label: "Inicio", to: "/", available: true },
    { label: "Experiencias", to: "/experiencias", available: true },
    { label: "Becas", to: "/becas", available: true },
    { label: "Reservaciones", to: "/cuenta/reservaciones", available: true },
    { label: "Eventos", to: "/eventos", available: true },
    { label: "Ayuda", to: "/ayuda", available: false },
];

export default function Navbar() {
    // Solo importa en pantallas angostas: ahí el menú se esconde detrás del botón
    const [open, setOpen] = useState(false);
    const closeMenu = () => setOpen(false);
    const { user, logout } = useAuth();

    return (
        <nav className="navbar">
            <Link to="/" onClick={closeMenu}>
                <img className="navbar-logo" src={logo} alt="ZigZag" />
            </Link>

            <button
                type="button"
                className="navbar-toggle"
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={open}
                aria-controls="navbar-menu"
                onClick={() => setOpen(!open)}
            >
                {open ? <X size={26} /> : <Menu size={26} />}
            </button>

            {/* En escritorio este div no afecta el diseño (display: contents);
                en celular es el panel desplegable */}
            <div id="navbar-menu" className={open ? "navbar-menu open" : "navbar-menu"}>
                <div className="navbar-links">
                    {navLinks.map((link) =>
                        link.available ? (
                            <NavLink className="navbar-link" key={link.to} to={link.to} onClick={closeMenu}>
                                {link.label}
                            </NavLink>
                        ) : (
                            <span className="navbar-link navbar-link--disabled" key={link.to} aria-disabled="true">
                                {link.label}
                            </span>
                        )
                    )}
                </div>

                <div className="navbar-actions">
                    {user ? (
                        <>
                            <Link className="navbar-login" to={user.role === "ADMIN" || user.role === "SCHOLARSHIP_MANAGER" ? "/app/becas" : "/cuenta/becas"} onClick={closeMenu}>Mi cuenta</Link>
                            <button type="button" className="navbar-cta" onClick={() => { logout(); closeMenu(); }}>Cerrar sesión</button>
                        </>
                    ) : (
                        <>
                            <Link className="navbar-login" to="/login" onClick={closeMenu}>Iniciar sesión</Link>
                            <Link className="navbar-cta" to="/cuenta/reservaciones" onClick={closeMenu}>Planear visita</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}