import { NavLink, Link } from "react-router-dom";
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
    return (
        <nav className="navbar">
            <img className="navbar-logo" src={logo} alt="ZigZag" />

            <div className="navbar-links">
                {navLinks.map((link) => (
                    <NavLink className="navbar-link" key={link.to} to={link.to}>
                        {link.label}
                    </NavLink>
                ))}
            </div>

            <div className="navbar-actions">
                <Link className="navbar-login" to="/login">Iniciar sesión</Link>
                <Link className="navbar-cta" to="/planear-visita">Planear visita</Link>
            </div>
        </nav>
    );
}