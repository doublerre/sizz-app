import { useCallback, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import ReservationCalendar from "@/components/ReservationCalendar";
import { Sidebar } from "../../components/SideBarBox";
import AccountNavBar from "../../components/AccountNavBar";
import { useAuth } from "../../context/useAuth";
import { apiMessage, useApiResource } from "../../hooks/useApiResource";
import { useToast } from "../../context/useToast";
import { reservationsService, type ReservationStatus } from "../../services/reservations.service";
import { reservationStatusLabels } from "../app/reservations/reservations.data";
import "./MyReservationsPage.css";

const roleLabels: Record<string, string> = {
    ADMIN: "Administrador",
    CASHIER: "Taquilla",
    GUIDE: "Guía",
    SCHOLARSHIP_MANAGER: "Gestor Becas",
    USER: "Visitante",
};

const formatReservationDate = (iso: string) => {
    const [year, month, day] = iso.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

export default function MyReservationsPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const toast = useToast();
    const userName = user?.sub ?? "Usuario";
    const userRole = user ? roleLabels[user.role] ?? user.role : "";
    const initials = userName.slice(0, 2).toUpperCase();
    const loadReservations = useCallback(() => reservationsService.listAllMyReservations(), []);
    const { data, loading, error, reload } = useApiResource(loadReservations);
    const reservations = useMemo(() => data ?? [], [data]);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("Todos los estados");
    const [date, setDate] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [folioQuery, setFolioQuery] = useState("");
    const [folioLoading, setFolioLoading] = useState(false);
    const [folioError, setFolioError] = useState("");
    const pageSize = 3;
    const markedDates = useMemo(() => new Set(reservations.flatMap((reservation) => reservation.slotDate ? [reservation.slotDate] : [])), [reservations]);

    const filteredReservations = useMemo(() => reservations.filter((reservation) => {
        const matchesSearch = `${reservation.folio} ${reservation.institution ?? ""} ${reservation.contactName}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesStatus = status === "Todos los estados" || reservation.status === status;
        const matchesDate = !date || reservation.slotDate === date;
        return matchesSearch && matchesStatus && matchesDate;
    }), [date, reservations, search, status]);

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

    const findByFolio = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const folio = folioQuery.trim();
        if (!folio) return;
        setFolioLoading(true);
        setFolioError("");
        try {
            const reservation = await reservationsService.getReservationByFolio(folio);
            navigate(`/cuenta/reservaciones/${reservation.id}`);
        } catch (error) {
            const message = apiMessage(error);
            setFolioError(message);
            toast.error(message);
        } finally {
            setFolioLoading(false);
        }
    };

    return (
        <div className="account-reservations-page">
            <Sidebar userName={userName} userRole={userRole} />

            <div className="account-page-main">
                <AccountNavBar
                    userName={userName}
                    userRole={userRole}
                    initials={initials}
                    logout={logout}
                    activeNav="reservaciones"
                />

                <main className="account-reservations-content">
                    <div className="account-reservations-heading">
                        <div><h1>Mis reservaciones</h1><p>Consulta el estado y los datos de tus solicitudes.</p></div>
                        <Link to="/cuenta/nueva-reservacion">Nueva reservación</Link>
                    </div>
                    <section className="reservation-filters" aria-label="Filtros de reservaciones">
                        <input
                            aria-label="Buscar folio o institución"
                            placeholder="Buscar folio o institución"
                            value={search}
                            onChange={(event) => updateSearch(event.target.value)}
                        />
                        <select aria-label="Filtrar por estado" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
                            <option>Todos los estados</option>
                            {(Object.keys(reservationStatusLabels) as ReservationStatus[]).map((value) => (
                                <option key={value} value={value}>{reservationStatusLabels[value]}</option>
                            ))}
                        </select>
                        <ReservationCalendar
                            value={date}
                            markedDates={markedDates}
                            variant="reservations"
                            onChange={(value) => { setDate(value); setPage(1); }}
                        />
                        <button type="button" onClick={clearFilters}>Limpiar filtros</button>
                    </section>

                    <form className="reservation-folio-lookup" onSubmit={findByFolio}>
                        <label htmlFor="folio-lookup">Consultar por folio</label>
                        <input id="folio-lookup" value={folioQuery} maxLength={40} onChange={(event) => setFolioQuery(event.target.value)} placeholder="RV-YYYYMMDD-0000" />
                        <button type="submit" disabled={folioLoading || !folioQuery.trim()}>{folioLoading ? "Buscando…" : "Buscar"}</button>
                        {folioError && <p role="alert">{folioError}</p>}
                    </form>

                    <section className="reservation-list" aria-label="Mis reservaciones">
                        {loading && <p className="reservations-empty">Cargando tus reservaciones…</p>}
                        {error && <p className="reservations-empty" role="alert">{error} <button type="button" onClick={reload}>Reintentar</button></p>}
                        {visibleReservations.map((reservation) => (
                            <article className="reservation-row" key={reservation.id}>
                                <div className="reservation-identity">
                                    <Link className="reservation-folio" to={`/cuenta/reservaciones/${reservation.id}`}>{reservation.folio}</Link>
                                    <h2>{reservation.institution || reservation.contactName}</h2>
                                    <p>Enviada el {new Date(reservation.createdAt).toLocaleDateString("es-MX")}</p>
                                </div>
                                <div className="reservation-field">
                                    <span>FECHA TENTATIVA</span>
                                    <strong>{reservation.slotDate ? formatReservationDate(reservation.slotDate) : "—"}</strong>
                                </div>
                                <div className="reservation-field">
                                    <span>VISITANTES</span>
                                    <strong>{reservation.visitorCount}</strong>
                                </div>
                                <span className={`reservation-status status-${reservation.status.toLowerCase().replaceAll("_", "-")}`}>
                                    {reservationStatusLabels[reservation.status]}
                                </span>
                            </article>
                        ))}
                        {!loading && !error && visibleReservations.length === 0 && <p className="reservations-empty">No hay reservaciones que coincidan con los filtros.</p>}
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
        </div>
    );
}
