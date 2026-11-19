
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { EllipsisVertical, LogOut, Menu, X } from "lucide-react";
import logo from "@/assets/logo_zigzag_main.svg";
import scholarshipLogo from "@/assets/scholarship-logo.png";
import { useAuth } from "@/context/useAuth";
import { ROLE_LABELS, sectionsFor, type NavItem } from "@/data/navigation";
import { shiftStatus } from "@/services/shiftStatus";
import { ticketbootService } from "@/services/ticketboot.service";
import "./AppSidebar.css";

export default function AppSidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [open, setOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const role = user?.role;
    const uid = user?.uid;
    const handlesShift = role === "ADMIN" || role === "CASHIER";


    const shiftOpen = useSyncExternalStore(shiftStatus.subscribe, () => (uid ? shiftStatus.get(uid) : null)) === true;

    // Solo pregunta al servidor si no se sabe o el dato ya es viejo (no en cada cambio de página)
    useEffect(() => {
        if (!handlesShift || !uid) return;
        // Si falla, la opción queda habilitada: la pantalla de inicio de turno vuelve a revisar
        if (shiftStatus.needsCheck(uid)) ticketbootService.getDashboard().catch(() => { });
    }, [handlesShift, uid]);


    useEffect(() => {
        if (!userMenuOpen) return;
        const closeOnOutsideClick = (e: MouseEvent) => {
            if (!userMenuRef.current?.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener("mousedown", closeOnOutsideClick);
        return () => document.removeEventListener("mousedown", closeOnOutsideClick);
    }, [userMenuOpen]);


    if (!role || !user || pathname.startsWith("/cuenta")) return null;
    const sections = sectionsFor(role);
    if (sections.length === 0) return null;

    const email = user.sub;
    const handleLogout = () => {
        logout();
        navigate("/login", { replace: true });
    };

    const renderItem = (item: NavItem) => {
        const dot = <span className="app-sidebar-dot" style={{ backgroundColor: item.color }} />;
        const blockedByShift = item.startsShift && shiftOpen;

        if (!item.to || blockedByShift) {
            return (
                <span
                    key={item.label}
                    className="app-sidebar-item app-sidebar-item-disabled"
                    aria-disabled="true"
                    title={blockedByShift ? "Ya tienes un turno abierto" : "Próximamente"}
                >
                    {dot}
                    {item.label}
                </span>
            );
        }

        return (
            <NavLink key={item.label} className="app-sidebar-item" to={item.to} end={item.end} onClick={() => setOpen(false)}>
                {dot}
                {item.label}
            </NavLink>
        );
    };

    return (
        <>
            {!open && (
                <button type="button" className="app-sidebar-toggle" aria-label="Abrir menú" onClick={() => setOpen(true)}>
                    <Menu size={22} />
                </button>
            )}
            {open && <div className="app-sidebar-overlay" onClick={() => setOpen(false)} />}

            <nav className={open ? "app-sidebar is-open" : "app-sidebar"} aria-label="Menú de la consola">
                <div className="app-sidebar-header">
                    <div>
                        <img src={pathname.startsWith("/app/becas") ? scholarshipLogo : logo} alt="ZigZag" />
                        <p className="app-sidebar-system">Sistema Integral ZigZag</p>
                    </div>
                    <button type="button" className="app-sidebar-close" aria-label="Cerrar menú" onClick={() => setOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                {/* Solo esta parte se desplaza si la pantalla es baja: el logo y la tarjeta quedan fijos */}
                <div className="app-sidebar-menu">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <h2 className="app-sidebar-group">{section.title}</h2>
                            {section.items.map(renderItem)}
                        </div>
                    ))}
                </div>

                <div className="app-sidebar-user" ref={userMenuRef}>
                    <div className="app-sidebar-avatar">{email.slice(0, 2).toUpperCase()}</div>
                    <div className="app-sidebar-user-info">
                        <span className="app-sidebar-user-name" title={email}>
                            {email}
                        </span>
                        <span className="app-sidebar-user-role">{ROLE_LABELS[role]}</span>
                    </div>
                    <button
                        type="button"
                        className="app-sidebar-user-more"
                        aria-label="Opciones de la cuenta"
                        aria-expanded={userMenuOpen}
                        onClick={() => setUserMenuOpen((value) => !value)}
                    >
                        <EllipsisVertical size={18} />
                    </button>
                    {userMenuOpen && (
                        <div className="app-sidebar-user-menu" role="menu">
                            <button type="button" role="menuitem" onClick={handleLogout}>
                                <LogOut size={16} /> Cerrar sesión
                            </button>
                        </div>
                    )}
                </div>
            </nav>
        </>
    );
}