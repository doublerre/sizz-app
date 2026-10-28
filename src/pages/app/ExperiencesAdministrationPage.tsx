import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CATEGORY_THEMES } from "../public/ExperiencesPage";
import {
  AUDIENCES,
  EXPERIENCE_ROUTES,
  type AdminExperience,
  type ExperienceStatus,
} from "../experiences/experience.data";
import { experiencesService } from "../../services/experiences.service";
import "./ExperiencesAdministrationPage.css";

/* ───────────── Tipos y utilidades ───────────── */

type ViewMode = "grid" | "list";

const STATUS_META: Record<ExperienceStatus, { label: string; className: string }> = {
  publicada: { label: "Publicada", className: "adm-status--published" },
  borrador: { label: "Borrador", className: "adm-status--draft" },
  revision: { label: "Requiere revisión", className: "adm-status--review" },
  desactivada: { label: "Desactivada", className: "adm-status--disabled" },
};

const normalize = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const toTitleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

const formatPrice = (n: number) =>
    new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);

/* ───────────── Subcomponentes ───────────── */

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}

function FilterSelect({ value, onChange, options, ariaLabel }: FilterSelectProps) {
  return (
      <div className="adm-select">
        <select
            className="adm-select__control"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label={ariaLabel}
        >
          {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
          ))}
        </select>
        <ChevronDown size={16} className="adm-select__chevron" aria-hidden="true" />
      </div>
  );
}

interface AdminExperienceCardProps {
  experience: AdminExperience;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onEdit?: (experience: AdminExperience) => void;
  onToggleStatus?: (experience: AdminExperience) => void;
  onDelete?: (experience: AdminExperience) => void;
}

function AdminExperienceCard({
                               experience,
                               menuOpen,
                               onToggleMenu,
                               onEdit,
                               onToggleStatus,
                               onDelete,
                             }: AdminExperienceCardProps) {
  const theme = CATEGORY_THEMES[experience.topic] || CATEGORY_THEMES.fisica;
  const Icon = theme.Icon;
  const status = STATUS_META[experience.status] || STATUS_META.borrador;

  return (
      <article className={`adm-card${menuOpen ? " adm-card--menu-open" : ""}`}>
        <div className="adm-card__banner" style={{ backgroundColor: theme.color }}>
          <div className="adm-card__banner-circle" />
          <span className="adm-card__tag" style={{ color: theme.badgeColor }}>
          {theme.label}
        </span>
          <div className="adm-card__icon">
            <Icon size={22} />
          </div>
        </div>

        <div className="adm-card__body">
          <h3 className="adm-card__title">{experience.name}</h3>
          <p className="adm-card__audience">{experience.audiences.join(" · ")}</p>

          <ul className="adm-card__meta">
            <li>
              <span className="adm-dot adm-dot--blue" />
              {experience.durationMinutes} min
            </li>
            <li>
              <span className="adm-dot adm-dot--green" />
              {experience.capacity} personas
            </li>
            <li>
              <span className="adm-dot adm-dot--yellow" />
              {formatPrice(experience.price)}
            </li>
          </ul>
        </div>

        <div className="adm-card__footer">
          <span className={`adm-status ${status.className}`}>{status.label}</span>

          <div className="adm-card__actions">
            <button type="button" className="adm-card__edit" onClick={() => onEdit?.(experience)}>
              Editar
            </button>

            <div className="adm-more">
              <button
                  type="button"
                  className="adm-more__btn"
                  aria-label={`Más opciones de ${experience.name}`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={onToggleMenu}
              >
                <MoreHorizontal size={18} />
              </button>
              {menuOpen && (
                  <ul className="adm-more__menu" role="menu">
                    <li role="menuitem" className="adm-more__item" onClick={() => onEdit?.(experience)}>
                      Ver detalle / Editar
                    </li>
                    <li
                        role="menuitem"
                        className="adm-more__item"
                        onClick={() => onToggleStatus?.(experience)}
                    >
                      {experience.status === "publicada" ? "Pasar a borrador" : "Publicar"}
                    </li>
                    <li
                        role="menuitem"
                        className="adm-more__item adm-more__item--danger"
                        onClick={() => onDelete?.(experience)}
                    >
                      Eliminar
                    </li>
                  </ul>
              )}
            </div>
          </div>
        </div>
      </article>
  );
}

/* ───────────── Página Principal ───────────── */

function ExperiencesAdministrationPage() {
  const navigate = useNavigate();

  const [experiences, setExperiences] = useState<AdminExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [audience, setAudience] = useState("all");
  const [status, setStatus] = useState("all");
  const [view, setView] = useState<ViewMode>("grid");
  const [openMenuId, setOpenMenuId] = useState<string | number | null>(null);

  const loadExperiences = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await experiencesService.getActivities();
      setExperiences(data);
    } catch (err: unknown) {
      console.error("Error al cargar actividades:", err);
      setError("No se pudieron cargar las experiencias. Por favor, verifica tu conexión e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  // Cierra el menú "⋯" al hacer clic fuera
  useEffect(() => {
    if (openMenuId === null) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".adm-more")) setOpenMenuId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [openMenuId]);

  const handleToggleStatus = async (exp: AdminExperience) => {
    setOpenMenuId(null);
    const newStatus: ExperienceStatus = exp.status === "publicada" ? "borrador" : "publicada";
    try {
      const updated = await experiencesService.updateActivityStatus(String(exp.id), newStatus);
      setExperiences((prev) => prev.map((item) => (item.id === exp.id ? updated : item)));
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      alert("No se pudo actualizar el estado de la experiencia.");
    }
  };

  const handleDelete = async (exp: AdminExperience) => {
    setOpenMenuId(null);
    const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar la experiencia "${exp.name}"?`);
    if (!confirmed) return;

    try {
      await experiencesService.deleteActivity(String(exp.id));
      setExperiences((prev) => prev.filter((item) => item.id !== exp.id));
    } catch (err) {
      console.error("Error al eliminar experiencia:", err);
      alert("No se pudo eliminar la experiencia.");
    }
  };

  const stats = useMemo(() => {
    const total = experiences.length;
    const count = (s: ExperienceStatus) => experiences.filter((e) => e.status === s).length;
    const published = count("publicada");
    return {
      total,
      published,
      publishedPct: total ? Math.round((published / total) * 100) : 0,
      draft: count("borrador"),
      review: count("revision"),
    };
  }, [experiences]);

  const filtered = useMemo(() => {
    const q = normalize(search.trim());
    return experiences.filter((e) => {
      const topicLabel = CATEGORY_THEMES[e.topic]?.label || "";
      if (q && !normalize(`${e.name} ${topicLabel}`).includes(q)) return false;
      if (category !== "all" && e.topic !== category) return false;
      if (audience !== "all" && !e.audiences.includes(audience)) return false;
      if (status !== "all" && e.status !== status) return false;
      return true;
    });
  }, [experiences, search, category, audience, status]);

  const hasFilters = search !== "" || category !== "all" || audience !== "all" || status !== "all";

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setAudience("all");
    setStatus("all");
  };

  const categoryOptions = [
    { value: "all", label: "Todas las categorías" },
    ...Object.entries(CATEGORY_THEMES).map(([key, t]) => ({ value: key, label: toTitleCase(t.label) })),
  ];
  const audienceOptions = [
    { value: "all", label: "Todos los públicos" },
    ...AUDIENCES.map((a) => ({ value: a, label: a })),
  ];
  const statusOptions = [
    { value: "all", label: "Todos los estados" },
    { value: "publicada", label: "Publicada" },
    { value: "borrador", label: "Borrador" },
    { value: "revision", label: "Requiere revisión" },
  ];

  return (
      <div className="adm-page">
        <header className="adm-head">
          <div className="adm-head__text">
            <h1 className="adm-head__title">Experiencias</h1>
            <p className="adm-head__subtitle">
              Catálogo central para taquilla, reservaciones y portal público.
            </p>
          </div>

          <button
              type="button"
              className="adm-btn-primary"
              onClick={() => navigate(EXPERIENCE_ROUTES.new)}
          >
            <Plus size={16} strokeWidth={2.6} />
            Nueva experiencia
          </button>
        </header>

        <div className="adm-content">
          {/* Resumen */}
          <section className="adm-stats" aria-label="Resumen del catálogo">
            <div className="adm-stat">
              <div className="adm-stat__icon adm-stat__icon--blue"><BookOpen size={20} /></div>
              <div>
                <span className="adm-stat__label">Catálogo total</span>
                <div className="adm-stat__value">{stats.total}</div>
              </div>
            </div>

            <div className="adm-stat">
              <div className="adm-stat__icon adm-stat__icon--green"><Check size={20} /></div>
              <div>
                <span className="adm-stat__label">Publicadas</span>
                <div className="adm-stat__value">
                  {stats.published}
                  <span className="adm-stat__hint adm-stat__hint--green">{stats.publishedPct}%</span>
                </div>
              </div>
            </div>

            <div className="adm-stat">
              <div className="adm-stat__icon adm-stat__icon--yellow"><PencilLine size={20} /></div>
              <div>
                <span className="adm-stat__label">En borrador</span>
                <div className="adm-stat__value">{stats.draft}</div>
              </div>
            </div>

            <div className="adm-stat">
              <div className="adm-stat__icon adm-stat__icon--red"><X size={20} /></div>
              <div>
                <span className="adm-stat__label">Requieren revisión</span>
                <div className="adm-stat__value">
                  {stats.review}
                  <span className="adm-stat__hint">sin horario</span>
                </div>
              </div>
            </div>
          </section>

          {/* Filtros */}
          <section className="adm-filters" aria-label="Filtros">
            <div className="adm-search">
              <Search size={18} color="#64748B" aria-hidden="true" />
              <input
                  type="text"
                  className="adm-search__input"
                  placeholder="Buscar experiencia..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Buscar experiencia"
              />
            </div>

            <FilterSelect value={category} onChange={setCategory} options={categoryOptions} ariaLabel="Filtrar por categoría" />
            <FilterSelect value={audience} onChange={setAudience} options={audienceOptions} ariaLabel="Filtrar por público" />
            <FilterSelect value={status} onChange={setStatus} options={statusOptions} ariaLabel="Filtrar por estado" />

            <div className="adm-toggle" role="group" aria-label="Tipo de vista">
              <button
                  type="button"
                  className={`adm-toggle__btn${view === "grid" ? " adm-toggle__btn--active" : ""}`}
                  onClick={() => setView("grid")}
                  aria-label="Vista de cuadrícula"
                  aria-pressed={view === "grid"}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                  type="button"
                  className={`adm-toggle__btn${view === "list" ? " adm-toggle__btn--active" : ""}`}
                  onClick={() => setView("list")}
                  aria-label="Vista de lista"
                  aria-pressed={view === "list"}
              >
                <List size={18} />
              </button>
            </div>

            <button type="button" className="adm-filters__clear" onClick={clearFilters} disabled={!hasFilters}>
              Limpiar
            </button>
          </section>

          {/* Catálogo */}
          <section aria-labelledby="adm-catalog-title">
            <h2 id="adm-catalog-title" className="adm-catalog__title">Catálogo de experiencias</h2>
            <p className="adm-catalog__count">
              Mostrando {filtered.length} de {experiences.length} experiencias
            </p>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "3rem", gap: "0.5rem", color: "#64748B" }}>
                  <Loader2 className="animate-spin" size={24} />
                  <span>Cargando catálogo de experiencias...</span>
                </div>
            ) : error ? (
                <div style={{ textAlign: "center", padding: "3rem", color: "#DC2626" }}>
                  <p>{error}</p>
                  <button
                      type="button"
                      className="adm-btn-primary"
                      style={{ marginTop: "1rem", display: "inline-flex" }}
                      onClick={loadExperiences}
                  >
                    <RefreshCw size={16} /> Reintentar
                  </button>
                </div>
            ) : experiences.length === 0 ? (
                <p className="adm-empty">Aún no hay experiencias. Crea la primera con “Nueva experiencia”.</p>
            ) : filtered.length === 0 ? (
                <p className="adm-empty">Ninguna experiencia coincide con los filtros. Prueba con otros o límpialos.</p>
            ) : (
                <div className={`adm-grid${view === "list" ? " adm-grid--list" : ""}`}>
                  {filtered.map((exp) => (
                      <AdminExperienceCard
                          key={exp.id}
                          experience={exp}
                          menuOpen={openMenuId === exp.id}
                          onToggleMenu={() => setOpenMenuId((id) => (id === exp.id ? null : exp.id))}
                          onEdit={(e) => navigate(EXPERIENCE_ROUTES.edit(e.id))}
                          onToggleStatus={handleToggleStatus}
                          onDelete={handleDelete}
                      />
                  ))}
                </div>
            )}
          </section>
        </div>
      </div>
  );
}

export default ExperiencesAdministrationPage;