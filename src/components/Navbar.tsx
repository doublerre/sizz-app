import { NavLink, Link } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo_zigzag_main.svg";
import "./Navbar.css";

const navLinks = [
    { label: "Inicio", to: "/" },
    { label: "Experiencias", to: "/experiencias" },
    { label: "Reservaciones", to: "/reservaciones" },
    { label: "Eventos", to: "/eventos" },
    { label: "Ayuda", to: "/ayuda" },
];

export default function Navbar() {
    // Solo importa en pantallas angostas
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

            <div id="navbar-menu" className={open ? "navbar-menu open" : "navbar-menu"}>
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <NavLink className="navbar-link" key={link.to} to={link.to} onClick={closeMenu}>
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-actions">
                    <Link className="navbar-login" to="/login" onClick={closeMenu}>Iniciar sesión</Link>
                    <Link className="navbar-cta" to="/planear-visita" onClick={closeMenu}>Planear visita</Link>
                </div>
            </div>
        </nav>
    );
}