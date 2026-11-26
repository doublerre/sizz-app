import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DateInput from "@/components/DateInput";
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  MoreHorizontal,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { reservationStatusLabels, dateLabel } from "./reservations.data";
import { apiMessage, useApiResource } from "@/hooks/useApiResource";
import { useToast } from "@/context/useToast";
import { reservationsService, type ReservationResponse, type ReservationStatus, type ReservationFilters, type RequesterType } from "@/services/reservations.service";
import "./reservations.css";

/* ─── Tipos ─── */

interface ReservationRequest {
  id: string;
  folio: string;
  applicantName: string;
  institution: string;
  visitDate: string;
  visitTime: string;
  groupSize: number;
  status: ReservationStatus;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  answers: ReservationResponse["answers"];
  createdAt: string;
}

const toReservationRequest = (reservation: ReservationResponse): ReservationRequest => ({
  id: reservation.id,
  folio: reservation.folio,
  applicantName: reservation.contactName,
  institution: reservation.institution ?? "",
  visitDate: reservation.slotDate ?? "",
  visitTime: reservation.startTime ?? "",
  groupSize: reservation.visitorCount,
  status: reservation.status,
  contactEmail: reservation.contactEmail,
  contactPhone: reservation.contactPhone,
  notes: reservation.notes,
  answers: reservation.answers,
  createdAt: reservation.createdAt,
});

/* ─── Subcomponentes ─── */

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  ariaLabel: string;
}

function FilterSelect({ value, onChange, options, ariaLabel }: FilterSelectProps) {
  return (
    <div className="res-select">
      <select
        className="res-select__control"
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
      <ChevronDown size={16} className="res-select__chevron" aria-hidden="true" />
    </div>
  );
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const classNameMap: Record<ReservationStatus, string> = {
    PENDING: "res-status--pending",
    PENDING_VALIDATION: "res-status--in-review",
    CONFIRMED: "res-status--approved",
    ATTENDED: "res-status--approved",
    CANCELLED: "res-status--rejected",
    NO_SHOW: "res-status--rejected",
  };
  return (
    <span className={`res-status ${classNameMap[status]}`}>
      {reservationStatusLabels[status]}
    </span>
  );
}

/* Menú de acciones */
function ActionsMenu({ id, folio }: { id: string; folio: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".res-more")) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="res-more">
      <button
        type="button"
        className="res-more__btn"
        aria-label={`Más opciones de ${folio}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <ul className="res-more__menu" role="menu">
          <li>
            <Link
              className="res-more__item"
              role="menuitem"
              to={`/app/reservaciones/${id}`}
              onClick={() => setOpen(false)}
            >
              Verificar reservación
            </Link>
          </li>
        </ul>
      )}
    </div>
  );
}

/* Tarjetas de resumen */
function SummaryCards({ data }: { data: ReservationRequest[] }) {
  const counts = useMemo(
    () => ({
      pending: data.filter((r) => r.status === "PENDING").length,
      inReview: data.filter((r) => r.status === "PENDING_VALIDATION").length,
      approved: data.filter((r) => r.status === "CONFIRMED" || r.status === "ATTENDED").length,
      rejected: data.filter((r) => r.status === "CANCELLED" || r.status === "NO_SHOW").length,
    }),
    [data],
  );

  return (
    <section className="res-stats" aria-label="Resumen de solicitudes">
      <div className="res-stat">
        <div className="res-stat__icon res-stat__icon--yellow">
          <Clock size={20} />
        </div>
        <div>
          <span className="res-stat__label">Pendientes</span>
          <div className="res-stat__value">{counts.pending}</div>
        </div>
      </div>
      <div className="res-stat">
        <div className="res-stat__icon res-stat__icon--blue">
          <Eye size={20} />
        </div>
        <div>
          <span className="res-stat__label">Pendientes de validación</span>
          <div className="res-stat__value">{counts.inReview}</div>
        </div>
      </div>
      <div className="res-stat">
        <div className="res-stat__icon res-stat__icon--green">
          <CheckCircle size={20} />
        </div>
        <div>
          <span className="res-stat__label">Confirmadas / asistidas</span>
          <div className="res-stat__value">{counts.approved}</div>
        </div>
      </div>
      <div className="res-stat">
        <div className="res-stat__icon res-stat__icon--red">
          <XCircle size={20} />
        </div>
        <div>
          <span className="res-stat__label">Canceladas / no presentadas</span>
          <div className="res-stat__value">{counts.rejected}</div>
        </div>
      </div>
    </section>
  );
}

/* Paginación */
function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generar páginas a mostrar
  const pages: (number | "...")[] = [];
  const maxVisible = 5;

  if (totalPages <= maxVisible + 2) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push("...");
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push("...");
    pages.push(totalPages);
  }

  return (
    <div className="res-pagination">
      <span className="res-pagination__info">
        Mostrando {startItem}–{endItem} de {totalItems} solicitudes
      </span>
      <div className="res-pagination__buttons">
        <button
          className="res-page-btn res-page-btn--nav"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="res-page-btn" style={{ cursor: "default" }}>
              ···
            </span>
          ) : (
            <button
              key={page}
              className={`res-page-btn${page === currentPage ? " res-page-btn--active" : ""}`}
              onClick={() => onPageChange(page as number)}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page}
            </button>
          ),
        )}
        <button
          className="res-page-btn res-page-btn--nav"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ─── Página principal ─── */

export default function AdminReservations() {
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [activityFilter, setActivityFilter] = useState("");
  const [requesterTypeFilter, setRequesterTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const loadActivities = useCallback(() => reservationsService.getActivities(), []);
  const { data: activities } = useApiResource(loadActivities);
  const filters = useMemo<ReservationFilters>(() => ({
    ...(statusFilter ? { status: statusFilter as ReservationStatus } : {}),
    ...(dateFrom ? { fromDate: dateFrom } : {}),
    ...(dateTo ? { toDate: dateTo } : {}),
    ...(activityFilter ? { activityId: activityFilter } : {}),
    ...(requesterTypeFilter ? { requesterType: requesterTypeFilter as RequesterType } : {}),
    ...(search.trim() ? { search: search.trim() } : {}),
  }), [statusFilter, dateFrom, dateTo, activityFilter, requesterTypeFilter, search]);
  const loadReservations = useCallback(() => reservationsService.listReservations(page - 1, pageSize, filters), [page, pageSize, filters]);
  const { data: response, loading, error, reload } = useApiResource(loadReservations);
  const reservations = useMemo(() => (response?.content ?? []).map(toReservationRequest), [response]);
  const filtered = reservations;
  const totalPages = Math.max(1, response?.totalPages ?? 0);
  const safePage = Math.min(page, totalPages);
  const paged = filtered;


  const hasFilters =
    search !== "" || statusFilter !== "" || dateFrom !== "" || dateTo !== "" || activityFilter !== "" || requesterTypeFilter !== "";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
    setActivityFilter("");
    setRequesterTypeFilter("");
    setPage(1);
  };

  async function handleExport() {
    const headers = [
      "Folio",
      "Institución",
      "Nombre de contacto",
      "Correo",
      "Teléfono",
      "Fecha de visita",
      "Grupo",
      "Estado",
      "Notas",
      "Respuestas dinámicas",
    ];
    try {
      const allReservations = await reservationsService.listAllReservations(filters);
      const answersById = new Map<string, unknown>();
      for (let offset = 0; offset < allReservations.length; offset += 10) {
        const batch = allReservations.slice(offset, offset + 10);
        const results = await Promise.all(batch.map(async (reservation) => {
          const answers = await reservationsService.getReservationAnswers(reservation.id);
          return [reservation.id, answers.answers] as const;
        }));
        results.forEach(([id, answers]) => answersById.set(id, answers));
      }
      const rows = allReservations.map((reservation) => [
        reservation.folio,
        reservation.institution ?? "",
        reservation.contactName,
        reservation.contactEmail,
        reservation.contactPhone ?? "",
        `${dateLabel(reservation.slotDate)} · ${reservation.startTime ?? ""}`,
        String(reservation.visitorCount),
        reservationStatusLabels[reservation.status],
        reservation.notes ?? "",
        JSON.stringify(answersById.get(reservation.id) ?? {}),
      ]);
      const csv = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reservaciones.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast.error(apiMessage(error));
    }
  }

  const statusOptions = [
    { value: "", label: "Todos los estados" },
    ...Object.entries(reservationStatusLabels).map(([value, label]) => ({ value, label })),
  ];
  const requesterTypeOptions = [
    { value: "", label: "Todos los solicitantes" },
    { value: "INDIVIDUAL", label: "Individual" },
    { value: "SCHOOL", label: "Escuela" },
    { value: "GROUP", label: "Grupo" },
  ];

  return (
    <div className="res-page">
      <header className="res-head">
        <div className="res-head__text">
          <h1 className="res-head__title">Solicitudes de reservación</h1>
          <p className="res-head__subtitle">
            Revisa respuestas y emite un dictamen.
          </p>
        </div>
        <div className="res-head__actions">
          <Link className="res-btn-secondary" to="/app/reservaciones/agenda">
            Gestionar agenda
          </Link>
          <Link
            className="res-btn-secondary"
            to="/app/reservaciones/formularios"
          >
            <FileText size={16} strokeWidth={2.6} />
            Gestionar formularios
          </Link>
          <button className="res-btn-primary" onClick={() => void handleExport()} disabled={loading}>
            <Download size={16} strokeWidth={2.6} />
            Exportar respuestas
          </button>
        </div>
      </header>

      <div className="res-content">
        <SummaryCards data={reservations} />
        <p className="res-section__count">Los indicadores resumen esta página; la exportación considera todos los resultados de los filtros.</p>

        {/* Filtros */}
        <section className="res-filters" aria-label="Filtros">
          <div className="res-search">
            <Search size={18} color="#64748B" aria-hidden="true" />
            <input
              type="text"
              className="res-search__input"
              placeholder="Buscar folio, institución o contacto"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              aria-label="Buscar solicitud"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={(value) => { setStatusFilter(value); setPage(1); }}
            options={statusOptions}
            ariaLabel="Filtrar por estado"
          />

          <FilterSelect value={requesterTypeFilter} onChange={(value) => { setRequesterTypeFilter(value); setPage(1); }} options={requesterTypeOptions} ariaLabel="Filtrar por tipo de solicitante" />

          <FilterSelect
            value={activityFilter}
            onChange={(value) => { setActivityFilter(value); setPage(1); }}
            options={[{ value: "", label: "Todas las actividades" }, ...(activities ?? []).map((activity) => ({ value: activity.id, label: activity.name }))]}
            ariaLabel="Filtrar por actividad"
          />

          <div className="res-select">
            <DateInput
              className="res-select__control"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              aria-label="Fecha de visita desde"
            />
          </div>

          <div className="res-select">
            <DateInput
              className="res-select__control"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              aria-label="Fecha de visita hasta"
            />
          </div>

          <button
            type="button"
            className="res-filters__clear"
            onClick={clearFilters}
            disabled={!hasFilters}
          >
            Limpiar
          </button>
        </section>

        {/* Tabla */}
        <section aria-labelledby="res-requests-title">
          <h2 id="res-requests-title" className="res-section__title">
            Solicitudes
          </h2>
          <p className="res-section__count">
            {response?.totalElements ?? 0} registro{response?.totalElements !== 1 ? "s" : ""} encontrado
            {response?.totalElements !== 1 ? "s" : ""}
          </p>
          {loading && <p className="res-empty">Cargando reservaciones…</p>}
          {error && <p className="res-empty" role="alert">{error} <button type="button" onClick={reload}>Reintentar</button></p>}

          <div className="res-table-card">
            <div className="res-table-wrap">
              <table className="res-table">
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Institución</th>
                    <th>Fecha de visita</th>
                    <th>Grupo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && !error && paged.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <Link
                          className="res-folio-link"
                          to={`/app/reservaciones/${r.id}`}
                        >
                          {r.folio}
                        </Link>
                      </td>
                      <td>{r.institution}</td>
                      <td>
                        {dateLabel(r.visitDate)} · {r.visitTime}
                      </td>
                      <td>{r.groupSize}</td>
                      <td>
                        <StatusBadge status={r.status} />
                      </td>
                      <td>
                        <ActionsMenu
                          id={r.id}
                          folio={r.folio}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!loading && !error && paged.length === 0 && (
              <p className="res-empty">
                No hay solicitudes que coincidan con los filtros.
              </p>
            )}

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={response?.totalElements ?? 0}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
