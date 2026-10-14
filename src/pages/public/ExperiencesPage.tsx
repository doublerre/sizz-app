import { useEffect, useState, useMemo } from "react";
import logo from "../../assets/logo_zigzag_main.png";
import "./HomePage.css";
import "./ExperiencesPage.css";
import {
    Atom,
    Telescope,
    ScanEye,
    ToyBrick,
    Trees,
    RobotArm,
    CheckCircle2,
    Search,
    ChevronDown,
    Plus,
    X,
    Clock,
    User,
    Check,
} from "lucide-react";
import { portalService, type PublicActivity } from "@/services/portal.service";

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

    // Colores de categorías
    fisica: "#0868B7",
    astronomia: "#5CB85C",
    optica: "#EB4D5C",
    infantil: "#F5A623",
    ambiente: "#1B937D",
    tecnologia: "#7055C4",
};

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

export const CATEGORY_THEMES = {
    fisica: {
        label: "FÍSICA",
        color: C.fisica,
        badgeBg: "#EBF4FA",
        badgeColor: "#0868B7",
        Icon: Atom,
    },
    astronomia: {
        label: "ASTRONOMÍA",
        color: C.astronomia,
        badgeBg: "#EDF8EA",
        badgeColor: "#4A9E2F",
        Icon: Telescope,
    },
    optica: {
        label: "ÓPTICA",
        color: C.optica,
        badgeBg: "#FDEBEC",
        badgeColor: "#D93847",
        Icon: ScanEye,
    },
    infantil: {
        label: "INFANTIL",
        color: C.infantil,
        badgeBg: "#FEF7E6",
        badgeColor: "#C7840B",
        Icon: ToyBrick,
    },
    ambiente: {
        label: "AMBIENTE",
        color: C.ambiente,
        badgeBg: "#E6F5F2",
        badgeColor: "#157F6C",
        Icon: Trees,
    },
    tecnologia: {
        label: "TECNOLOGÍA",
        color: C.tecnologia,
        badgeBg: "#F1EDFA",
        badgeColor: "#5E44B5",
        Icon: RobotArm,
    },
};

export type CategoryKey = keyof typeof CATEGORY_THEMES;

export interface ExperienceCardProps {
    categoryKey?: CategoryKey;
    categoryTag?: string;
    color?: string;
    icon?: React.ReactNode;
    title?: string;
    description?: string;
    age?: string;
    duration?: string;
    ageBadgeBg?: string;
    ageBadgeColor?: string;
    onViewDetail?: () => void;
}

export function ExperienceCard({
    categoryKey = "fisica",
    categoryTag,
    color,
    icon,
    title,
    description,
    age,
    duration,
    ageBadgeBg,
    ageBadgeColor,
    onViewDetail,
}: ExperienceCardProps) {
    const theme = CATEGORY_THEMES[categoryKey] || CATEGORY_THEMES.fisica;
    const cardColor = color || theme.color;
    const tag = categoryTag || theme.label;
    const IconComponent = theme.Icon;

    return (
        <div className="exp-card">
            <div className="exp-card__banner" style={{ backgroundColor: cardColor }}>
                <div className="exp-card__banner-circle" />

                <span className="exp-card__tag" style={{ color: cardColor }}>
                    {tag}
                </span>

                <div className="exp-card__icon-wrap">
                    {icon ? icon : <IconComponent size={24} />}
                </div>
            </div>

            <div className="exp-card__body">
                <h3 className="exp-card__title">
                    {title || "Nombre de la experiencia"}
                </h3>
                <p className="exp-card__desc">
                    {description || "Descripción de la actividad..."}
                </p>

                <div className="exp-card__badges">
                    <span
                        className="exp-card__badge-age"
                        style={{
                            backgroundColor: ageBadgeBg || theme.badgeBg,
                            color: ageBadgeColor || theme.badgeColor,
                        }}
                    >
                        {age || "Edad sugerida"}
                    </span>
                    <span className="exp-card__badge-duration">
                        {duration || "-- min"}
                    </span>
                </div>
            </div>

            <div className="exp-card__footer">
                <span className="exp-card__included">
                    Incluida con entrada general
                </span>
                <span
                    className="exp-card__link"
                    onClick={onViewDetail}
                >
                    Ver detalle →
                </span>
            </div>
        </div>
    );
}

const TOPICS = [
    "Todos los temas",
    "Física",
    "Astronomía",
    "Óptica",
    "Infantil",
    "Ambiente",
    "Tecnología",
];

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const toCategoryKey = (topic?: string): CategoryKey => {
    const key = topic?.toLowerCase() as CategoryKey;
    return key in CATEGORY_THEMES ? key : "fisica";
}

const formatAge = (min: number | null, max: number | null) => {
    if (min == null && max == null) return "Todas las edades";
    if (min != null && max != null) return `De ${min} a ${max} años`;
    if (min != null) return `Desde ${min} años`;
    return `Hasta ${max} años`;
};

const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);

const AGE_FILTERS = [
    { label: "Todas las edades", min: 0, max: 120 },
    { label: "3 a 7 años", min: 3, max: 7 },
    { label: "8 a 12 años", min: 8, max: 12 },
    { label: "13 años o más", min: 13, max: 120 },
];

const DURATION_FILTERS = [
    { label: "Cualquier duración", min: 0, max: Infinity },
    { label: "Hasta 30 min", min: 0, max: 30 },
    { label: "31 a 59 min", min: 31, max: 59 },
    { label: "60 min o más", min: 60, max: Infinity },
];

export default function ExperiencesPage() {
    const [activities, setActivities] = useState<PublicActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [menuOpen, setMenuOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("Todos los temas");
    const [selectedAge, setSelectedAge] = useState("Todas las edades");
    const [selectedDuration, setSelectedDuration] = useState("Cualquier duración");

    const [topicMenuOpen, setTopicMenuOpen] = useState(false);
    const [ageMenuOpen, setAgeMenuOpen] = useState(false);
    const [durationMenuOpen, setDurationMenuOpen] = useState(false);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<PublicActivity | null>(null);



    const AGES = AGE_FILTERS.map((f) => f.label);
    const DURATIONS = DURATION_FILTERS.map((f) => f.label);

    const navLinks = [
        { label: "Inicio", href: "/" },
        { label: "Experiencias", href: "/experiencias" },
        { label: "Eventos", href: "/eventos" },
    ];

    const handleClearFilters = () => {
        setSearchQuery("");
        setSelectedTopic("Todos los temas");
        setSelectedAge("Todas las edades");
        setSelectedDuration("Cualquier duración");
    };
    useEffect(() => {
        portalService.getActivities()
            .then(setActivities)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [])

    const filteredActivities = useMemo(() => {
        const q = normalize(searchQuery.trim());
        const ageF = AGE_FILTERS.find((f) => f.label === selectedAge)!;
        const durF = DURATION_FILTERS.find((f) => f.label === selectedDuration)!;

        return activities.filter((act) => {
            const themeLabel = CATEGORY_THEMES[toCategoryKey(act.topic)].label;

            if (q && !normalize(`${act.name} ${act.description} ${themeLabel}`).includes(q))
                return false;

            if (selectedTopic !== "Todos los temas" &&
                normalize(themeLabel) !== normalize(selectedTopic))
                return false;

            if ((act.minAge ?? 0) > ageF.max || (act.maxAge ?? 120) < ageF.min)
                return false;

            if (act.durationMinutes < durF.min || act.durationMinutes > durF.max)
                return false;

            return true;
        });
    }, [activities, searchQuery, selectedTopic, selectedAge, selectedDuration]);

    return (
        <div className="sizz-page exp-page">
            <nav className="sizz-nav">
                <img src={logo} alt="Logo Zigzag" className="sizz-nav__logo" />

                <div className="sizz-nav__links">
                    {navLinks.map(({ label, href }) => (
                        <a key={href} href={href} className="sizz-nav__link">
                            {label}
                        </a>
                    ))}
                </div>

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
                    {/* Reservaciones no está disponible aún como ruta pública */}
                    <button
                        style={{
                            ...btnBase,
                            border: `2px solid #CBD5E0`,
                            backgroundColor: "#EDF2F7",
                            color: "#A0AEC0",
                            cursor: "not-allowed",
                        }}
                        disabled
                        title="Próximamente"
                    >
                        Planear visita
                    </button>
                </div>

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
                    {/* Reservaciones no está disponible aún como ruta pública */}
                    <button
                        style={{
                            ...btnBase,
                            border: `2px solid #CBD5E0`,
                            backgroundColor: "#EDF2F7",
                            color: "#A0AEC0",
                            cursor: "not-allowed",
                            flex: "1 1 auto",
                            justifyContent: "center",
                        }}
                        disabled
                        title="Próximamente"
                    >
                        Planear visita
                    </button>
                </div>
            </div>

            <section className="exp-hero" style={{ backgroundColor: C.blueDark }}>
                <div style={{ position: "absolute", top: "-60px", left: "25%", width: "240px", height: "240px", borderRadius: "50%", backgroundColor: "#2EAF6B", opacity: 0.16, filter: "blur(45px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-70px", left: "15%", width: "260px", height: "260px", borderRadius: "50%", backgroundColor: C.yellow, opacity: 0.14, filter: "blur(50px)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", top: "20px", right: "30%", width: "200px", height: "200px", borderRadius: "50%", backgroundColor: C.red, opacity: 0.12, filter: "blur(40px)", pointerEvents: "none" }} />

                <div className="exp-hero__col-text">
                    <span className="exp-hero__eyebrow">
                        EXPLORA, APRENDE Y DESCUBRE
                    </span>

                    <h1 className="exp-hero__title">
                        Experiencias para vivir la ciencia
                    </h1>

                    <p className="exp-hero__desc">
                        Conoce las actividades incluidas con tu entrada general a Zigzag.<br />
                        Elige cuáles quieres descubrir durante tu visita.
                    </p>

                    {/* /reservaciones no existe como ruta pública — CTA deshabilitado */}
                    <span
                        className="exp-hero__btn-schedule"
                        style={{ opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }}
                        title="Próximamente"
                    >
                        Consultar horarios de visita
                    </span>
                </div>

                <div className="exp-hero__col-card">
                    <div className="exp-hero__card">
                        <div className="exp-hero__card-header">
                            <div className="exp-hero__card-icon">
                                <Plus size={30} strokeWidth={2.8} />
                            </div>
                            <div>
                                <div className="exp-hero__card-badge">
                                    ACCESO A EXPERIENCIAS
                                </div>
                                <h3 className="exp-hero__card-title">
                                    Entrada general
                                </h3>
                            </div>
                        </div>

                        <div className="exp-hero__card-items">
                            <div className="exp-hero__card-item">
                                <span className="badge-check">
                                    <CheckCircle2 size={18} color={C.green} fill={C.green} />
                                </span>
                                <span>Sin costo individual por actividad</span>
                            </div>
                            <div className="exp-hero__card-item">
                                <span className="badge-check">
                                    <CheckCircle2 size={18} color={C.green} fill={C.green} />
                                </span>
                                <span>Sujeto a horarios y capacidad</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="exp-main-section">
                <div className="exp-bg-circle" />

                <div className="exp-main-header">
                    <h2 className="exp-main-header__title">
                        Encuentra tu próxima experiencia
                    </h2>
                    <p className="exp-main-header__desc">
                        Filtra por tema, edad recomendada o duración.
                    </p>
                </div>

                <div className="exp-filters-bar">
                    <div className="exp-search-box">
                        <Search size={18} color="#94A3B8" />
                        <input
                            type="text"
                            className="exp-search-input"
                            placeholder="Buscar por nombre o tema..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="exp-dropdown">
                        <button
                            type="button"
                            className={`exp-dropdown__btn ${topicMenuOpen || selectedTopic !== "Todos los temas" ? "active" : ""}`}
                            onClick={() => {
                                setTopicMenuOpen(!topicMenuOpen);
                                setAgeMenuOpen(false);
                                setDurationMenuOpen(false);
                            }}
                        >
                            <span>{selectedTopic}</span>
                            <ChevronDown
                                size={16}
                                style={{
                                    transform: topicMenuOpen ? "rotate(180deg)" : "none",
                                    transition: "transform 0.2s",
                                }}
                            />
                        </button>
                        {topicMenuOpen && (
                            <ul className="exp-dropdown__menu">
                                {TOPICS.map((topic) => (
                                    <li
                                        key={topic}
                                        className={`exp-dropdown__item ${selectedTopic === topic ? "selected" : ""}`}
                                        onClick={() => {
                                            setSelectedTopic(topic);
                                            setTopicMenuOpen(false);
                                        }}
                                    >
                                        <span>{topic}</span>
                                        {selectedTopic === topic && <Check size={14} color={C.blue} />}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="exp-dropdown">
                        <button
                            type="button"
                            className={`exp-dropdown__btn ${ageMenuOpen || selectedAge !== "Todas las edades" ? "active" : ""}`}
                            onClick={() => {
                                setAgeMenuOpen(!ageMenuOpen);
                                setTopicMenuOpen(false);
                                setDurationMenuOpen(false);
                            }}
                        >
                            <span>{selectedAge}</span>
                            <ChevronDown
                                size={16}
                                style={{
                                    transform: ageMenuOpen ? "rotate(180deg)" : "none",
                                    transition: "transform 0.2s",
                                }}
                            />
                        </button>
                        {ageMenuOpen && (
                            <ul className="exp-dropdown__menu">
                                {AGES.map((age) => (
                                    <li
                                        key={age}
                                        className={`exp-dropdown__item ${selectedAge === age ? "selected" : ""}`}
                                        onClick={() => {
                                            setSelectedAge(age);
                                            setAgeMenuOpen(false);
                                        }}
                                    >
                                        <span>{age}</span>
                                        {selectedAge === age && <Check size={14} color={C.blue} />}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="exp-dropdown">
                        <button
                            type="button"
                            className={`exp-dropdown__btn ${durationMenuOpen || selectedDuration !== "Cualquier duración" ? "active" : ""}`}
                            onClick={() => {
                                setDurationMenuOpen(!durationMenuOpen);
                                setTopicMenuOpen(false);
                                setAgeMenuOpen(false);
                            }}
                        >
                            <span>{selectedDuration}</span>
                            <ChevronDown
                                size={16}
                                style={{
                                    transform: durationMenuOpen ? "rotate(180deg)" : "none",
                                    transition: "transform 0.2s",
                                }}
                            />
                        </button>
                        {durationMenuOpen && (
                            <ul className="exp-dropdown__menu">
                                {DURATIONS.map((dur) => (
                                    <li
                                        key={dur}
                                        className={`exp-dropdown__item ${selectedDuration === dur ? "selected" : ""}`}
                                        onClick={() => {
                                            setSelectedDuration(dur);
                                            setDurationMenuOpen(false);
                                        }}
                                    >
                                        <span>{dur}</span>
                                        {selectedDuration === dur && <Check size={14} color={C.blue} />}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <button
                        type="button"
                        className="exp-filters-clear"
                        onClick={handleClearFilters}
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="exp-count-label">
                    {loading
                        ? "Cargando..."
                        : `${filteredActivities.length} experiencia${filteredActivities.length !== 1 ? "s" : ""} disponible${filteredActivities.length !== 1 ? "s" : ""}`}
                </div>

                <div className="exp-grid">
                    {loading ? (
                        <p className="exp-loading">Cargando experiencias...</p>
                    ) : activities.length === 0 ? (
                        <p className="exp-empty">No hay experiencias disponibles en este momento.</p>
                    ) : filteredActivities.length === 0 ? (
                        <p className="exp-empty">
                            Ninguna experiencia coincide con tu búsqueda. Prueba con otros filtros.
                        </p>
                    ) : (
                        filteredActivities.map((act) => (
                            <ExperienceCard
                                key={act.id}
                                categoryKey={toCategoryKey(act.topic)}
                                title={act.name}
                                description={act.description}
                                age={formatAge(act.minAge, act.maxAge)}
                                duration={`${act.durationMinutes} min`}
                                onViewDetail={() => {
                                    setSelectedActivity(act);
                                    setDetailModalOpen(true);
                                }}
                            />
                        ))
                    )}
                </div>

                <div className="exp-cta-banner">
                    <div className="exp-cta-banner__left">
                        <div className="exp-cta-banner__icon">
                            <Plus size={28} strokeWidth={2.8} />
                        </div>
                        <div>
                            <h4 className="exp-cta-banner__title">
                                Todas las experiencias forman parte de tu visita
                            </h4>
                            <p className="exp-cta-banner__subtitle">
                                La entrada general se adquiere en taquilla. Algunas actividades pueden requerir horario o registro por capacidad.
                            </p>
                        </div>
                    </div>
                    {/* /reservaciones no existe como ruta pública — botón deshabilitado */}
                    <span
                        className="exp-cta-banner__btn"
                        style={{ opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }}
                        title="Próximamente"
                    >
                        Planear mi visita
                    </span>
                </div>
            </section>

            {detailModalOpen && selectedActivity && (() => {
                const theme = CATEGORY_THEMES[toCategoryKey(selectedActivity.topic)];
                return (
                    <div className="exp-modal-backdrop" onClick={() => setDetailModalOpen(false)}>
                        <div className="exp-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="exp-modal__header" style={{ backgroundColor: theme.color }}>
                                <button className="exp-modal__close" onClick={() => setDetailModalOpen(false)} aria-label="Cerrar">
                                    <X size={18} />
                                </button>
                                <h3 className="exp-modal__title">{selectedActivity.name}</h3>
                                <p className="exp-modal__desc">{selectedActivity.description}</p>
                            </div>

                            <div className="exp-modal__body">
                                {selectedActivity.tariffs.length > 0 && (
                                    <div>
                                        <h4 className="exp-modal__section-title">Tarifas vigentes</h4>
                                        <ul className="exp-modal__tariffs">
                                            {selectedActivity.tariffs.map((t) => (
                                                <li key={t.visitorTypeName}>
                                                    <span>{t.visitorTypeName}</span>
                                                    <strong>{formatPrice(t.price)}</strong>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="exp-modal__meta">
                                    <div className="exp-modal__meta-item">
                                        <User size={16} color={theme.color} />
                                        <span>{formatAge(selectedActivity.minAge, selectedActivity.maxAge)}</span>
                                    </div>
                                    <div className="exp-modal__meta-item">
                                        <Clock size={16} color={theme.color} />
                                        <span>{selectedActivity.durationMinutes} min</span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "0.75rem" }}>
                                    {/* /reservaciones no existe como ruta pública */}
                                    <span
                                        style={{ opacity: 0.4, cursor: "not-allowed", pointerEvents: "none",
                                            ...btnBase, backgroundColor: theme.color, color: "#fff",
                                            flex: 1, justifyContent: "center", textDecoration: "none" }}
                                        title="Próximamente"
                                    >
                                        Reservar visita
                                    </span>
                                    <button
                                        style={{ ...btnBase, border: "1px solid #E2E8F0", backgroundColor: "#fff", color: C.textMid }}
                                        onClick={() => setDetailModalOpen(false)}>
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}

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
                        <img
                            src={logo}
                            alt="Zigzag"
                            style={{
                                height: "48px",
                                width: "auto",
                                filter: "brightness(0) invert(1)",
                                alignSelf: "flex-start",
                            }}
                        />
                        <p style={{ fontSize: "0.82rem", lineHeight: 1.7, margin: 0, maxWidth: "260px" }}>
                            Centro interactivo de Ciencia y Tecnología Zigzag · Zacatecas<br />
                            Consulta experiencias, reservaciones y eventos desde SIZZ.
                        </p>
                    </div>

                    <div style={{ flex: "1 1 120px" }}>
                        <h5 style={{ color: "#fff", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 1rem" }}>
                            EXPLORA
                        </h5>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            {["Experiencias", "Eventos"].map((item) => (
                                <a
                                    key={item}
                                    href={`/${item.toLowerCase()}`}
                                    style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: "0.88rem", transition: "color 0.2s" }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
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
                            {["Preguntas frecuentes", "Consulta / Info", "Aviso de privacidad"].map((item) => (
                                <span
                                    key={item}
                                    style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", cursor: "not-allowed" }}
                                    title="Próximamente"
                                >
                                    {item}
                                </span>
                            ))}

                        </div>
                    </div>

                    <div style={{ flex: "1 1 120px", display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                        {/* /reservaciones no existe como ruta pública — enlace deshabilitado */}
                        <span
                            style={{
                                ...btnBase,
                                backgroundColor: "#A0AEC0",
                                border: `2px solid #A0AEC0`,
                                color: "#fff",
                                textDecoration: "none",
                                fontSize: "0.9rem",
                                whiteSpace: "nowrap",
                                cursor: "not-allowed",
                                opacity: 0.6,
                                pointerEvents: "none",
                            }}
                            title="Próximamente"
                        >
                            Planea tu visita
                        </span>
                    </div>
                </div>

                <div
                    style={{
                        borderTop: "1px solid rgba(255,255,255,0.12)",
                        paddingTop: "1.2rem",
                        textAlign: "left",
                        fontSize: "0.78rem",
                        color: "rgba(255,255,255,0.45)",
                    }}
                >
                    © 2026 Zigzag Zacatecas · Sistema Integral Zigzag
                </div>
            </footer>
        </div>
    );
}
