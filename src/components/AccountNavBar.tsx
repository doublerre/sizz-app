import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo_zigzag_main.svg";
import { ChevronDown, ChevronUp, LogOut } from "lucide-react";
import "./AccountNavBar.css";

interface AccountNavBarProps {
    userName: string;
    userRole: string;
    initials: string;
    logout: () => void;
    activeNav: "reservaciones" | "nueva-reservacion" | "perfil";
}

export default function AccountNavBar({ userName, userRole, initials, logout, activeNav }: AccountNavBarProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    return (
        <header className="account-header">
            <Link className="account-brand" to="/" aria-label="ZigZag, inicio">
                <img src={logo} alt="ZigZag" />
            </Link>
            <nav className="account-nav" aria-label="Navegación de cuenta">
                <Link
                    to="/cuenta/reservaciones"
                    className={activeNav === "reservaciones" ? "active" : ""}
                >
                    Mis reservaciones
                </Link>
                <Link
                    to="/cuenta/nueva-reservacion"
                    className={activeNav === "nueva-reservacion" ? "active" : ""}
                >
                    Nueva reservación
                </Link>
                <Link
                    to="/cuenta/perfil"
                    className={activeNav === "perfil" ? "active" : ""}
                >
                    Mi perfil
                </Link>
            </nav>
            <div className="account-user">
                <button
                    className="account-user-trigger"
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    aria-expanded={dropdownOpen}
                    aria-label="Menú de usuario"
                >
                    <span className="account-avatar">{initials}</span>
                    <span className="account-user-copy">
                        <strong>{userName}</strong>
                        <small>{userRole}</small>
                    </span>
                    {dropdownOpen ? (
                        <ChevronUp className="account-user-chevron" size={16} />
                    ) : (
                        <ChevronDown className="account-user-chevron" size={16} />
                    )}
                </button>
                {dropdownOpen && (
                    <div className="account-dropdown">
                        <Link
                            className="account-dropdown-item"
                            to="/login"
                            onClick={() => {
                                setDropdownOpen(false);
                                logout();
                            }}
                        >
                            <LogOut size={16} />
                            Cerrar sesión
                        </Link>
                    </div>
                )}
            </div>
        </header>
    );
}
