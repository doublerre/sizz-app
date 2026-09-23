import { useState, useEffect } from "react";
import logo from "../../assets/logo_zigzag_main.png";
import "./HomePage.css";
import {
    User,
    CheckCircle2,
    ShieldCheck,
    ChevronRight,
    Users,
    Earth,
    CheckIcon,
    Calendar1,
    RobotArm,
    PartyPopper
} from "lucide-react";

// Colores utilizados en el diseño (agregar si hay faltantes o modificar si es la paleta incorrecta)
const C = {
    blue: "#0868B7",
    blueDark: "#004F8F",
    blueNavy: "#10243A",
    lightBlue: "#2B78B9",
    lightBlue2: "#3C8FC4",
    yellow: "#F5A623",
    lightYellow: "#FFF7D6",
    yellowDark: "#D48C0E",
    lightGreen: "#EDF8E9",
    green: "#2EAF6B",
    red: "#E84040",
    grayLight: "#F4F6F9",
    textDark: "#1A1A2E",
    textMid: "#4A5568",
    textLight: "#718096",
};
// Estilos base para botones
const btnBase: React.CSSProperties = {
    padding: "0.6rem 1.4rem",
    borderRadius: "8px",
    fontWeight: 700,
    fontSize: "0.9rem",
    cursor: "pointer",
    transition: "all 0.2s",
    display: "inline-flex",
    alignItems: "center",
    gap: "0.4rem",
};

// Elemento WhatCard para la seccion de TODO EN UN MISMO LUGAR
function WhatCard({
    icon,
    title,
    desc,
    linkText,
    href,
    iconBg,
    linkColor,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    linkText: string;
    href: string;
    iconBg?: string;
    linkColor?: string;
}) {
    return (
        <div
            style={{
                flex: "1 1 0",
                padding: "2rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                borderRadius: "12px",
                backgroundColor: "#fff",
                border: "1px solid #e8ecf0",
                transition: "box-shadow 0.2s",
            }}
            onMouseEnter={e =>
            ((e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 24px rgba(0,101,179,0.12)")
            }
            onMouseLeave={e =>
                ((e.currentTarget as HTMLDivElement).style.boxShadow = "none")
            }
        >
            <div
                style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: iconBg ?? "rgba(0,101,179,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: C.blue,
                }}
            >
                {icon}
            </div>
            <h3
                style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color: C.textDark,
                    margin: 0,
                }}
            >
                {title}
            </h3>
            <p style={{ color: C.textMid, fontSize: "0.9rem", margin: 0, lineHeight: 1.6 }}>
                {desc}
            </p>
            <a
                href={href}
                style={{
                    color: linkColor ?? C.blue,
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    marginTop: "auto",
                    paddingTop: "0.5rem",
                    transition: "gap 0.2s",
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.gap = "0.5rem")}
                onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.gap = "0.2rem")}
            >
                {linkText} <ChevronRight size={16} />
            </a>
        </div>
    );
}

// Hook para detectar si la pantalla es compacta (resoluciones medianas o menores)
function useIsCompact() {
    const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 860px)").matches);
    useEffect(() => {
        const mq = window.matchMedia("(max-width: 860px)");
        const handler = (e: MediaQueryListEvent) => setCompact(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return compact;
}
// Elemento de tarjeta para la seccion de experiencias
function ExperienceCard({
    color,
    icon,
    title,
    desc,
    btnText,
    href,
}: {
    color: string;
    icon: React.ReactNode;
    title: string;
    desc: string;
    btnText: string;
    href: string;
}) {
    const compact = useIsCompact();
    const [open, setOpen] = useState(false);

    if (!compact) {
        return (
            <div
                style={{
                    flex: "1 1 0",
                    backgroundColor: color,
                    borderRadius: "16px",
                    padding: "2rem 1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    color: "#fff",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: "-30px",
                        right: "-30px",
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.08)",
                    }}
                />
                <div
                    style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {icon}
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>{title}</h3>
                <p style={{ fontSize: "0.88rem", margin: 0, opacity: 0.9, lineHeight: 1.6, flexGrow: 1 }}>
                    {desc}
                </p>
                <a
                    href={href}
                    style={{
                        ...btnBase,
                        border: "2px solid rgba(255,255,255,0.7)",
                        backgroundColor: "transparent",
                        color: "#fff",
                        fontSize: "0.85rem",
                        alignSelf: "flex-start",
                        textDecoration: "none",
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.2)";
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                    }}
                >
                    {btnText}
                </a>
            </div>
        );
    }

    return (
        <div
            style={{
                backgroundColor: color,
                borderRadius: "16px",
                padding: "1.25rem 1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
            }}
            onClick={() => setOpen(o => !o)}
        >
            <div
                style={{
                    position: "absolute",
                    top: "-30px",
                    right: "-30px",
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    pointerEvents: "none",
                }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div
                    style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                    }}
                >
                    {icon}
                </div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, flexGrow: 1 }}>
                    {title}
                </h3>
                <ChevronRight
                    size={20}
                    color="rgba(255,255,255,0.8)"
                    style={{
                        flexShrink: 0,
                        transform: open ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.3s ease",
                    }}
                />
            </div>
            <div
                style={{
                    maxHeight: open ? "200px" : "0",
                    overflow: "hidden",
                    transition: "max-height 0.35s ease",
                }}
            >
                <div style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <p style={{ fontSize: "0.88rem", margin: 0, opacity: 0.9, lineHeight: 1.6 }}>
                        {desc}
                    </p>
                    <a
                        href={href}
                        onClick={e => e.stopPropagation()}
                        style={{
                            ...btnBase,
                            border: "2px solid rgba(255,255,255,0.7)",
                            backgroundColor: "transparent",
                            color: "#fff",
                            fontSize: "0.85rem",
                            alignSelf: "flex-start",
                            textDecoration: "none",
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "rgba(255,255,255,0.2)";
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLAnchorElement).style.backgroundColor = "transparent";
                        }}
                    >
                        {btnText}
                    </a>
                </div>
            </div>
        </div>
    );
}

// Elemento StepCircle para la seccion de 3 pasos
function StepCircle({
    number,
    color,
    title,
    desc,
}: {
    number: string;
    color: string;
    title: string;
    desc: string;
}) {
    return (
        <div
            style={{
                flex: "1 1 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: "1rem",
                padding: "1.5rem 1rem",
                position: "relative",
                zIndex: 1,
            }}
        >
            <div
                style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    backgroundColor: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "1.8rem",
                    fontWeight: 800,
                    boxShadow: `0 8px 20px ${color}55`,
                }}
            >
                {number}
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, color: C.textDark, margin: 0 }}>
                {title}
            </h4>
            <p style={{ fontSize: "0.85rem", color: C.textMid, margin: 0, lineHeight: 1.5 }}>
                {desc}
            </p>
        </div>
    );
}


export default function HomePage() {
    const [menuOpen, setMenuOpen] = useState(false);

    const navLinks = [
        { label: "Inicio", href: "/" },
        { label: "Experiencias", href: "/experiencias" },
        { label: "Reservaciones", href: "/reservaciones" },
        { label: "Eventos", href: "/eventos" },
        { label: "Ayuda", href: "/ayuda" },
    ];

    return (
        <div className="sizz-page">

            {/* Barra de navegación */}
            <nav className="sizz-nav">
                <img src={logo} alt="Logo Zigzag" className="sizz-nav__logo" />

                {/* Enlaces para desktop (Inicio, experiencias, etc.) */}
                <div className="sizz-nav__links">
                    {navLinks.map(({ label, href }) => (
                        <a key={href} href={href} className="sizz-nav__link">{label}</a>
                    ))}
                </div>

                {/* Botones (login y reservas) */}
                <div className="sizz-nav__actions">
                    <button
                        style={{
                            ...btnBase,
                            border: `2px solid ${C.blue}`,
                            backgroundColor: "transparent",
                            color: C.blue,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = C.blue;
                            e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = C.blue;
                        }}
                        onClick={() => window.location.href = "/login"}
                    >
                        Iniciar sesión
                    </button>
                    <button
                        style={{
                            ...btnBase,
                            border: `2px solid ${C.blue}`,
                            backgroundColor: C.blue,
                            color: "#fff",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = C.blueDark;
                            e.currentTarget.style.borderColor = C.blueDark;
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = C.blue;
                            e.currentTarget.style.borderColor = C.blue;
                        }}
                    >
                        Reservar visita
                    </button>
                </div>

                {/* Menu hamburguesa para resoluciones medianas y pequeñas */}
                <button
                    className="sizz-nav__hamburger"
                    onClick={() => setMenuOpen(o => !o)}
                    aria-label="Abrir menú"
                >
                    <span style={{ transform: menuOpen ? "rotate(45deg) translate(5px, 5px)" : "none" }} />
                    <span style={{ opacity: menuOpen ? 0 : 1 }} />
                    <span style={{ transform: menuOpen ? "rotate(-45deg) translate(5px, -5px)" : "none" }} />
                </button>
            </nav>

            {/* Menu para dispositivos moviles */}
            <div className={`sizz-nav__mobile-menu${menuOpen ? " open" : ""}`}>
                {navLinks.map(({ label, href }) => (
                    <a
                        key={href}
                        href={href}
                        className="sizz-nav__mobile-link"
                        onClick={() => setMenuOpen(false)}
                    >
                        {label}
                    </a>
                ))}
                <div className="sizz-nav__mobile-actions">
                    <button
                        style={{
                            ...btnBase,
                            border: `2px solid ${C.blue}`,
                            backgroundColor: "transparent",
                            color: C.blue,
                            flex: "1 1 auto",
                            justifyContent: "center",
                        }}
                        onClick={() => { window.location.href = "/login"; setMenuOpen(false); }}
                    >
                        Iniciar sesión
                    </button>
                    <button
                        style={{
                            ...btnBase,
                            border: `2px solid ${C.blue}`,
                            backgroundColor: C.blue,
                            color: "#fff",
                            flex: "1 1 auto",
                            justifyContent: "center",
                        }}
                        onClick={() => setMenuOpen(false)}
                    >
                        Reservar visita
                    </button>
                </div>
            </div>

            {/* Hero */}
            <section
                className="sizz-hero"
                style={{ backgroundColor: C.blueDark }}
            >
                <div style={{ position: "absolute", top: "-60px", left: "30%", width: "220px", height: "220px", borderRadius: "50%", backgroundColor: "#2EAF6B", opacity: 0.18, filter: "blur(40px)" }} />
                <div style={{ position: "absolute", bottom: "-80px", left: "20%", width: "280px", height: "280px", borderRadius: "50%", backgroundColor: C.yellow, opacity: 0.15, filter: "blur(50px)" }} />
                <div style={{ position: "absolute", top: "40px", right: "35%", width: "180px", height: "180px", borderRadius: "50%", backgroundColor: C.red, opacity: 0.14, filter: "blur(35px)" }} />

                <div className="sizz-hero__col sizz-hero__col--text">
                    <span
                        className="sizz-hero__badge"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            backgroundColor: C.lightBlue,
                            color: "#fff",
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            letterSpacing: "0.08em",
                            padding: "0.35rem 1rem",
                            borderRadius: "999px",
                            marginBottom: "1.5rem",
                        }}
                    >
                        <span style={{ color: C.yellow }}> ● </span>
                        CENTRO INTERACTIVO ZIGZAG
                    </span>

                    <h1
                        className="sizz-hero__title"
                        style={{
                            fontSize: "clamp(2.8rem, 3.8vw, 3.8rem)",
                            fontWeight: 800,
                            color: "#ffffff",
                            lineHeight: 1.15,
                            margin: "0 0 1.25rem",
                            letterSpacing: "-0.5px",
                        }}
                    >
                        Tu visita a Zigzag<br />empieza aquí.
                    </h1>

                    <p
                        className="sizz-hero__desc"
                        style={{
                            color: "rgba(255,255,255,0.8)",
                            fontSize: "clamp(1.1rem, 1.25vw, 1.25rem)",
                            lineHeight: 1.65,
                            margin: "0 0 2.2rem",
                            maxWidth: "100%",
                        }}
                    >
                        Descubre experiencias, consulta fechas disponibles y organiza<br className="sizz-hero-br" /> tu visita de forma sencilla, desde cualquier lugar.
                    </p>

                    {/* Botones para reserva y eventos */}
                    <div className="sizz-hero__buttons" style={{ display: "flex", gap: "1.1rem", flexWrap: "wrap", marginBottom: "2.2rem" }}>
                        <a
                            href="/reservaciones"
                            style={{
                                ...btnBase,
                                backgroundColor: C.yellow,
                                border: `2px solid ${C.yellow}`,
                                color: "#000",
                                padding: "0.85rem 2rem",
                                fontSize: "1rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                borderRadius: "10px",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.yellowDark;
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.yellowDark;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.yellow;
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.yellow;
                            }}
                        >
                            Reservar una visita
                        </a>
                        <a
                            href="/eventos"
                            style={{
                                ...btnBase,
                                backgroundColor: C.lightBlue,
                                color: "#fff",
                                padding: "0.85rem 2rem",
                                fontSize: "1rem",
                                fontWeight: 700,
                                textDecoration: "none",
                                borderRadius: "10px",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.lightBlue2;
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.lightBlue2;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.lightBlue;
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.lightBlue;
                            }}
                        >
                            Explorar eventos
                        </a>
                    </div>

                    <div className="sizz-hero__badges" style={{ display: "flex", gap: "1.8rem", flexWrap: "wrap" }}>
                        {["Disponibilidad actualizada", "Confirmación y folio"].map(text => (
                            <span
                                key={text}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5rem",
                                    color: "rgba(255,255,255,0.85)",
                                    fontSize: "0.9rem",
                                    fontWeight: 500,
                                }}
                            >
                                <span className="badge-check"><CheckCircle2 size={17} color={C.green} fill={C.green} /></span>
                                {text}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Card para planear visita */}
                <div className="sizz-hero__col sizz-hero__col--card">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                            style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "50%",
                                backgroundColor: C.blue,
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem", textAlign: 'left' }}>
                            <p style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: C.textDark }}>
                                Planea tu visita
                            </p>
                            <p style={{ margin: 0, fontSize: "0.78rem", color: C.textLight }}>
                                Selecciona una fecha disponible
                            </p>
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "0.65rem", alignItems: "stretch", flex: 1, marginTop: "0.85rem" }}>

                        <div
                            style={{
                                flex: "1 1 0",
                                backgroundColor: "#EEF4FB",
                                borderRadius: "14px",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "1rem 0.75rem",
                                gap: "0.75rem",
                            }}
                        >
                            {/* Este icono es provisional */}
                            <div
                                style={{
                                    width: "84px",
                                    height: "84px",
                                    borderRadius: "50%",
                                    backgroundColor: "rgba(255,255,255,0.85)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 12px rgba(0,101,179,0.1)",
                                }}
                            >
                                <Earth size={48} color={C.blue} />
                            </div>
                            <div style={{ textAlign: "center" }}>
                                <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: C.textDark }}>
                                    Ciencia que conecta
                                </p>
                                <p style={{ margin: 0, fontSize: "0.74rem", color: C.textLight, marginTop: "0.2rem" }}>
                                    Aprende, experimenta y descubre
                                </p>
                            </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", width: "135px" }}>
                            <button
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: "0",
                                    padding: "0.85rem",
                                    borderRadius: "12px",
                                    border: "none",
                                    backgroundColor: "#FFF9ED",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = "#FFF0CC";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(245,166,35,0.2)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = "#FFF9ED";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "10px",
                                        backgroundColor: C.yellow,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Calendar1 size={20} color="#fff" />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: C.textDark }}>Fechas</div>
                                    <div style={{ fontSize: "0.74rem", color: C.textLight }}>y horarios</div>
                                </div>
                            </button>

                            <button
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                    gap: "0",
                                    padding: "0.85rem",
                                    borderRadius: "12px",
                                    border: "none",
                                    backgroundColor: "#EDFAF3",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = "#D4F4E3";
                                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(46,175,107,0.2)";
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = "#EDFAF3";
                                    e.currentTarget.style.boxShadow = "none";
                                }}
                            >
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "30px",
                                        backgroundColor: C.green,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <Users size={20} color="#fff" />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: C.textDark }}>Grupos</div>
                                    <div style={{ fontSize: "0.74rem", color: C.textLight }}>y escuelas</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Seccion - TODO EN UN MISMO LUGAR */}
            <section className="sizz-section" style={{ backgroundColor: "#fff" }}>
                <div className="sizz-section-header--center">
                    <span className="sizz-section-badge">TODO EN UN MISMO LUGAR</span>
                    <h2
                        style={{
                            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                            fontWeight: 800,
                            color: C.textDark,
                            margin: "0.5rem 0 0.75rem",
                        }}
                    >
                        ¿Qué quieres hacer hoy?
                    </h2>
                    <p style={{ color: C.textMid, fontSize: "1rem", margin: 0 }}>
                        Elige el recorrido que mejor se adapte a tu visita.
                    </p>
                </div>

                <div className="sizz-cards-row">
                    <WhatCard
                        icon={<User size={22} />}
                        title="Soy visitante"
                        desc="Consulta fechas, horarios y actividades disponibles antes de venir."
                        linkText="Explorar experiencias"
                        href="/experiencias"
                    />
                    <WhatCard
                        icon={<Users size={22} color={C.green} />}
                        title="Escuela o grupo"
                        desc="Guía tu visita, registra estudiantes y recibe la confirmación de tu reservación."
                        linkText="Organizar visita"
                        href="/reservaciones"
                        iconBg={C.lightGreen}
                        linkColor={C.green}
                    />
                    <WhatCard
                        icon={<Calendar1 size={22} color={C.yellow} />}
                        title="Eventos y convocatorias"
                        desc="Consulta próximos eventos y comprueba tu inscripción en línea."
                        linkText="Ver próximos eventos"
                        href="/eventos"
                        iconBg={C.lightYellow}
                        linkColor={C.yellow}
                    />
                </div>
            </section>

            {/* Seccion - Descubrir Zigzag (Experiencias) */}
            <section className="sizz-section" style={{ backgroundColor: C.grayLight }}>
                <div className="sizz-section-header">
                    <span className="sizz-section-badge">DESCUBRIR ZIGZAG</span>
                    <h2
                        style={{
                            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                            fontWeight: 800,
                            color: C.textDark,
                            margin: "0.5rem 0 0.5rem",
                        }}
                    >
                        Experiencias para aprender haciendo
                    </h2>
                    <p style={{ color: C.textMid, fontSize: "1rem", margin: 0 }}>
                        Opciones pensadas para visitantes, familias, escuelas y grupos.
                    </p>
                </div>

                <div className="sizz-cards-row">
                    <ExperienceCard
                        color={C.blue}
                        icon={<RobotArm size={24} color="#fff" />}
                        title="Experiencias interactivas"
                        desc="Salas y actividades para explorar la ciencia y la tecnología de forma participativa."
                        btnText="Conocer más"
                        href="/experiencias"
                    />
                    <ExperienceCard
                        color={C.green}
                        icon={<Users size={24} color="#fff" />}
                        title="Visitas escolares"
                        desc="Guía tu fecha, selecciona una fecha y organiza la visita de tu grupo con anticipación."
                        btnText="Consultar fechas"
                        href="/reservaciones"
                    />
                    <ExperienceCard
                        color={C.red}
                        icon={<PartyPopper size={24} color="#fff" />}
                        title="Eventos especiales"
                        desc="Encuentra talleres, convocatorias y actividades con registro disponibles desde el portal."
                        btnText="Ver eventos"
                        href="/eventos"
                    />
                </div>
            </section>

            {/* Seccion - Pasos para reservar  */}
            <section className="sizz-section" style={{ backgroundColor: "#fff" }}>
                <div className="sizz-section-header--center">
                    <span className="sizz-section-badge">RESERVACIONES</span>
                    <h2
                        style={{
                            fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
                            fontWeight: 800,
                            color: C.textDark,
                            margin: "0.5rem 0 0.75rem",
                        }}
                    >
                        Organiza tu visita en tres pasos
                    </h2>
                    <p style={{ color: C.textMid, fontSize: "1rem", margin: 0 }}>
                        Un proceso claro para visitantes, escuelas y grupos.
                    </p>
                </div>

                <div style={{ position: "relative", display: "flex", gap: "0", marginBottom: "3rem" }}>
                    <div
                        style={{
                            position: "absolute",
                            top: "60px",
                            left: "calc(16.67% + 36px)",
                            right: "calc(16.67% + 36px)",
                            height: 0,
                            borderTop: "3px dashed #c8d0da",
                            zIndex: 0,
                        }}
                    />
                    <StepCircle
                        number="1"
                        color={C.blue}
                        title="Elige fecha y actividad"
                        desc="Consulta fechas y cupo disponibles."
                    />
                    <StepCircle
                        number="2"
                        color={C.green}
                        title="Registra tus datos"
                        desc="Indica disponibilidad, asistentes y necesidades relevantes."
                    />
                    <StepCircle
                        number="3"
                        color={C.yellow}
                        title="Recibe confirmación"
                        desc="Consulta la ficha o consulta el estado de tu solicitud."
                    />
                </div>

                {/* Cards informativas */}
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                    {[
                        {
                            icon: <ShieldCheck size={64} color={"white"} fill={C.blue} />,
                            title: "Información segura y confiable",
                            desc: "Tus datos y operaciones se gestionan con privacidad, trazabilidad y avisos de privacidad institucionales.",
                        },
                        {
                            icon: <CheckIcon size={64} color={C.green} />,
                            title: "Una sola fuente de información",
                            desc: "Horarios, disponibilidad, reservaciones y eventos en un solo lugar para facilitar tu visita.",
                        },
                    ].map(({ icon, title, desc }) => (
                        <div
                            key={title}
                            style={{
                                flex: "1 1 0",
                                display: "flex",
                                gap: "1rem",
                                alignItems: "flex-start",
                                padding: "1.5rem",
                                borderRadius: "12px",
                                backgroundColor: C.grayLight,
                                border: "1px solid #e8ecf0",
                            }}
                        >
                            <div
                                style={{
                                    flexShrink: 0,
                                    width: "64px",
                                    height: "64px",
                                    borderRadius: "10px",
                                    backgroundColor: "transparent",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {icon}
                            </div>
                            <div>
                                <h4 style={{ margin: "0 0 0.4rem", fontSize: "0.95rem", fontWeight: 700, color: C.textDark }}>
                                    {title}
                                </h4>
                                <p style={{ margin: 0, fontSize: "0.85rem", color: C.textMid, lineHeight: 1.6 }}>
                                    {desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Seccion - Footer (Secciones: Info, Explora, Ayuda y Boton a reservaciones) */}
            <footer
                style={{
                    backgroundColor: C.blueNavy,
                    color: "rgba(255,255,255,0.75)",
                    padding: "3rem 4% 1.5rem",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: "2rem",
                        flexWrap: "wrap",
                        marginBottom: "2.5rem",
                    }}
                >
                    <div style={{ flex: "2 1 200px", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <img src={logo} alt="Zigzag" style={{ height: "48px", width: "auto", filter: "brightness(0) invert(1)", alignSelf: "flex-start" }} />
                        <p style={{ fontSize: "0.82rem", lineHeight: 1.7, margin: 0, maxWidth: "260px" }}>
                            Centro Interactivo de Ciencia y Tecnología Zigzag · Zacatecas.<br />
                            Consulta experiencias, reservaciones y eventos desde 2025.
                        </p>
                    </div>

                    <div style={{ flex: "1 1 120px" }}>
                        <h5 style={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 1rem" }}>
                            EXPLORA
                        </h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {["Experiencias", "Eventos", "Reservaciones"].map(item => (
                                <a
                                    key={item}
                                    href={`/${item.toLowerCase()}`}
                                    style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.88rem", transition: "color 0.2s" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: "1 1 120px" }}>
                        <h5 style={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 1rem" }}>
                            AYUDA
                        </h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {["Preguntas frecuentes", "Consulta / Info", "Aviso de privacidad"].map(item => (
                                <a
                                    key={item}
                                    href="/ayuda"
                                    style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.88rem", transition: "color 0.2s" }}
                                    onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
                                >
                                    {item}
                                </a>
                            ))}
                        </div>
                    </div>

                    <div style={{ flex: "1 1 120px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        <a
                            href="/reservaciones"
                            style={{
                                ...btnBase,
                                backgroundColor: C.yellow,
                                border: `2px solid ${C.yellow}`,
                                color: "#fff",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                whiteSpace: "nowrap",
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.yellowDark;
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.yellowDark;
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.yellow;
                                (e.currentTarget as HTMLAnchorElement).style.borderColor = C.yellow;
                            }}
                        >
                            Planea tu visita
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div
                    style={{
                        borderTop: "1px solid rgba(255,255,255,0.12)",
                        paddingTop: "1.2rem",
                        textAlign: "left",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.45)",
                    }}
                >
                    © 2026 Zigzag Zacatecas · Sistema SIZZ Zigzag
                </div>
            </footer>
        </div>
    );
}