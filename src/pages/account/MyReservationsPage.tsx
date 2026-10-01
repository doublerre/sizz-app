import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import logo from "../../assets/logo_zigzag_main.svg";
import ReservationCalendar from "@/components/ReservationCalendar";
import "./MyReservationsPage.css";

type ReservationStatus = "En revisión" | "Aprobada" | "Pagada";

interface Reservation {
    id: number;
    folio: string;
    institution: string;
    submittedAt: string;
    visitDate: string;
    visitors: string;
    status: ReservationStatus;
}

const reservations: Reservation[] = [
    { id: 1, folio: "_", institution: "_", submittedAt: "_", visitDate: "2026-09-18", visitors: "_", status: "En revisión" },
    { id: 2, folio: "_", institution: "_", submittedAt: "_", visitDate: "2026-09-02", visitors: "_", status: "Aprobada" },
    { id: 3, folio: "_", institution: "_", submittedAt: "_", visitDate: "2026-09-21", visitors: "_", status: "Pagada" },
];

const formatReservationDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

export default function MyReservationsPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("Todos los estados");
    const [date, setDate] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const pageSize = 3;
    const markedDates = useMemo(() => new Set(reservations.map((reservation) => reservation.visitDate)), []);

    const filteredReservations = useMemo(() => reservations.filter((reservation) => {
        const matchesSearch = `${reservation.folio} ${reservation.institution}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus = status === "Todos los estados" || reservation.status === status;
        const matchesDate = !date || reservation.visitDate === date;
        return matchesSearch && matchesStatus && matchesDate;
    }), [date, search, status]);

    const pageCount = Math.ceil(filteredReservations.length / pageSize);
    const currentPage = pageCount === 0 ? 0 : Math.min(page, pageCount);
    const visibleReservations = filteredReservations.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const firstItem = filteredReservations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const lastItem = Math.min(currentPage * pageSize, filteredReservations.length);

    const clearFilters = () => {
        setSearch("");
        setStatus("Todos los estados");
        setDate(null);
        setPage(1);
    };

    const updateSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    return (
        <div className="account-reservations-page">
            <div className="account-breadcrumb">Cuenta / Mis reservaciones</div>
            <header className="account-header">
                <Link className="account-brand" to="/" aria-label="ZigZag, inicio">
                    <img src={logo} alt="ZigZag" />
                </Link>
                <nav className="account-nav" aria-label="Navegación de cuenta">
                    <NavLink to="/cuenta/reservaciones" end>Mis reservaciones</NavLink>
                    <Link to="/eventos">Nueva reservación</Link>
                    <span aria-disabled="true">Mi perfil</span>
                </nav>
                <div className="account-user">
                    <span className="account-avatar">_</span>
                    <span className="account-user-copy"><strong>_</strong><Link to="/login">Cerrar sesión</Link></span>
                </div>
            </header>

            <main className="account-reservations-content">
                <section className="reservation-filters" aria-label="Filtros de reservaciones">
                    <input
                        aria-label="Buscar folio o institución"
                        placeholder="Buscar folio o institución"
                        value={search}
                        onChange={(event) => updateSearch(event.target.value)}
                    />
                    <select aria-label="Filtrar por estado" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                        <option>Todos los estados</option>
                        <option>En revisión</option>
                        <option>Aprobada</option>
                        <option>Pagada</option>
                    </select>
                    <ReservationCalendar
                        value={date}
                        markedDates={markedDates}
                        variant="reservations"
                        onChange={(value) => { setDate(value); setPage(1); }}
                    />
                    <button type="button" onClick={clearFilters}>Limpiar filtros</button>
                </section>

                <section className="reservation-list" aria-label="Mis reservaciones">
                    {visibleReservations.map((reservation) => (
                        <article className="reservation-row" key={reservation.id}>
                            <div className="reservation-identity">
                                <span className="reservation-folio">{reservation.folio}</span>
                                <h2>{reservation.institution}</h2>
                                <p>Enviada el {reservation.submittedAt}</p>
                            </div>
                            <div className="reservation-field">
                                <span>FECHA TENTATIVA</span>
                                <strong>{formatReservationDate(reservation.visitDate)}</strong>
                            </div>
                            <div className="reservation-field">
                                <span>VISITANTES</span>
                                <strong>{reservation.visitors}</strong>
                            </div>
                            <span className={`reservation-status status-${reservation.status.toLowerCase().replaceAll(" ", "-")}`}>
                                {reservation.status}
                            </span>
                            <Link className="reservation-detail-link" to={`/cuenta/reservaciones/${reservation.id}`}>Ver detalle →</Link>
                        </article>
                    ))}
                    {visibleReservations.length === 0 && <p className="reservations-empty">No hay reservaciones que coincidan con los filtros.</p>}
                </section>

                <footer className="reservation-pagination">
                    <span>Mostrando {firstItem}–{lastItem} de {filteredReservations.length} reservaciones</span>
                    <nav aria-label="Paginación de reservaciones">
                        <button type="button" aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => setPage((value) => value - 1)}>‹</button>
                        {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
                            <button key={pageNumber} type="button" className={pageNumber === currentPage ? "current" : ""} onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                        ))}
                        <button type="button" aria-label="Página siguiente" disabled={currentPage === 0 || currentPage >= pageCount} onClick={() => setPage((value) => value + 1)}>›</button>
                    </nav>
                </footer>
            </main>
        </div>
    );
}