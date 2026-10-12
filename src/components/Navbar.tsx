import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo_zigzag_main.svg";
import "./Navbar.css";

//poner true cuando la ruta este disponible
const navLinks = [
    { label: "Inicio", to: "/", available: true },
    { label: "Experiencias", to: "/experiencias", available: false },
    { label: "Reservaciones", to: "/reservaciones", available: false },
    { label: "Eventos", to: "/eventos", available: true },
    { label: "Ayuda", to: "/ayuda", available: false },
];

export default function Navbar() {
    // Solo importa en pantallas angostas: ahí el menú se esconde detrás del botón
    const [open, setOpen] = useState(false);
    const closeMenu = () => setOpen(false);

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
                    <Link className="navbar-login" to="/login" onClick={closeMenu}>Iniciar sesión</Link>
                    {/* Sin ruta todavía: deshabilitado hasta que exista /planear-visita */}
                    <button type="button" className="navbar-cta" disabled>Planear visita</button>
                </div>
            </div>
        </nav>
    );
}