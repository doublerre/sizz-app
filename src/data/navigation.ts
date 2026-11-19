import type { AuthUser } from "@/context/useAuth";

type Role = AuthUser["role"];


export type NavItem = {
    label: string;
    to?: string;
    color: string;
    roles: Role[];
    end?: boolean;
    startsShift?: boolean;
};

export type NavSection = { title: string; items: NavItem[] };


const SECTIONS: NavSection[] = [
    {
        title: "Menú principal",
        items: [
            { label: "Inicio", to: "/app", color: "var(--brand-blue)", roles: ["ADMIN"], end: true },
            { label: "Experiencias", to: "/app/experiences", color: "var(--brand-green)", roles: ["ADMIN"] },
            { label: "Visitantes", color: "var(--brand-yellow)", roles: ["ADMIN"] },
            { label: "Reservaciones", to: "/app/reservaciones", color: "var(--brand-red)", roles: ["ADMIN"] },
            { label: "Eventos", to: "/app/eventos", color: "var(--brand-purple)", roles: ["ADMIN", "CONTROL"] },
            { label: "Contenidos", color: "var(--brand-blue)", roles: ["ADMIN"] },
            { label: "Reportes", color: "var(--brand-green)", roles: ["ADMIN"] },
        ],
    },
    {
        title: "Taquilla",
        items: [
            { label: "Inicio de turno", to: "/taquilla/inicio-turno", color: "var(--brand-blue)", roles: ["ADMIN", "CASHIER"], startsShift: true },
            { label: "Inicio", to: "/taquilla/dashboard", color: "var(--brand-blue)", roles: ["ADMIN", "CASHIER"] },
            { label: "Nueva venta", to: "/taquilla/newsale", color: "var(--brand-green)", roles: ["ADMIN", "CASHIER"] },
            { label: "Historial", to: "/taquilla/historial", color: "var(--brand-yellow)", roles: ["ADMIN", "CASHIER"] },
            { label: "Corte de caja", to: "/taquilla/corte", color: "var(--brand-red-light)", roles: ["ADMIN", "CASHIER"] },
        ],
    },
    {
        title: "Administración",
        items: [
            { label: "Boletos", color: "var(--brand-blue)", roles: ["ADMIN"] },
            { label: "Becas y guías", to: "/app/becas", color: "var(--brand-yellow)", roles: ["ADMIN", "SCHOLARSHIP_MANAGER"] },
            { label: "Usuarios", to: "/app/users", color: "var(--brand-yellow)", roles: ["ADMIN"] },
            { label: "Configuración", color: "var(--brand-red)", roles: ["ADMIN"] },
        ],
    },
];


export function sectionsFor(role: Role): NavSection[] {
    return SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter((item) => item.roles.includes(role)),
    })).filter((section) => section.items.length > 0);
}

// A dónde llega cada rol al iniciar sesión o al entrar a una ruta que no le toca
export function homeForRole(role: Role): string {
    switch (role) {
        case "ADMIN":
            return "/app";
        case "CASHIER":
            return "/taquilla";
        case "SCHOLARSHIP_MANAGER":
            return "/app/becas";
        case "CONTROL":
            return "/app/eventos";
        default:
            return "/";
    }
}

export const ROLE_LABELS: Record<Role, string> = {
    ADMIN: "Administrador",
    CASHIER: "Taquilla",
    CONTROL: "Control de eventos",
    SCHOLARSHIP_MANAGER: "Encargado de becas",
    REPORT: "Reportes",
    GUIDE: "Guía",
    USER: "Visitante",
};