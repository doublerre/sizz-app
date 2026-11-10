import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Sidebar } from '../components/SideBarBox';
import ReservationCalendar from '../components/ReservationCalendar';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { getLocalDateKey, salesHistoryService } from '../services/sales-history.service';
import type { SaleHistoryRecord } from '../services/sales-history.service';
import './SalesHistory.css';

/*formato dinero mx*/
const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

interface SalesHistoryProps {
    sales?: SaleHistoryRecord[];
}

export const SalesHistory = ({ sales }: SalesHistoryProps) => {
    const { user } = useAuth();
    const toast = useToast();
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('Todos');
    const [date, setDate] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [storedSales, setStoredSales] = useState<SaleHistoryRecord[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(sales === undefined);
    const [cancellingFolio, setCancellingFolio] = useState<string | null>(null);
    const pageSize = 5;

    //Carga las ventas, sino se han recibido como prop, desde el servicio de historial de ventas.
    useEffect(() => {
        if (sales !== undefined) return;
        let isActive = true;

        salesHistoryService.getSales()
            .then((loadedSales) => {
                if (isActive) {
                    setStoredSales(loadedSales);
                    setLoadError(null);
                }
            })
            .catch(() => {
                if (isActive) {
                    setLoadError('No se pudo cargar el historial de ventas desde el servidor.');
                }
            })
            .finally(() => {
                if (isActive) setIsLoading(false);
            });

    //control de actualización de datos de ventas y genera fechas en las que existen ventas registradas
        return () => {
            isActive = false;
        };
    }, [sales]);

    const allSales = sales ?? storedSales;
    const markedDates = useMemo(
        () => new Set(allSales.flatMap((sale) => sale.date ? [sale.date] : [])),
        [allSales],
    );

    const visibleSales = useMemo(() => allSales.filter((sale) => {
		const matchesSearch = `${sale.folio} ${sale.payment}`.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = status === 'Todos' || sale.status === status;
        const matchesDate = !date || sale.date === date;
        return matchesSearch && matchesStatus && matchesDate;
    }), [allSales, search, status, date]);

    //cantidad de páginas se calcula con las ventas filtradas y el tamaño de página.
    const totalPages = Math.ceil(visibleSales.length / pageSize);
    const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages);
    const pageSales = visibleSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const firstResult = visibleSales.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const lastResult = Math.min(currentPage * pageSize, visibleSales.length);

    // tarjetas resumen - datos recibidos.
    const activeSales = allSales.filter((sale) => sale.status === 'Activo');
    const salesToday = activeSales.filter((sale) => sale.date === getLocalDateKey());
    const totalAmountToday = salesToday.reduce((sum, sale) => sum + sale.total, 0);
    const ticketCount = activeSales.reduce((sum, sale) => sum + sale.tickets, 0);
    const cancelledCount = allSales.filter((sale) => sale.status === 'Cancelado').length;
    // Al cambiar un filtro, la tabla vuelve a la primera página para evitar páginas vacías.
    const updateSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const updateStatus = (value: string) => {
        setStatus(value);
        setPage(1);
    };

    //Función para reintentar la carga por si no cargo
    const retryLoadSales = () => {
        setIsLoading(true);
        setLoadError(null);
        salesHistoryService.getSales()
            .then(setStoredSales)
            .catch(() => setLoadError('No se pudo cargar el historial de ventas desde el servidor.'))
            .finally(() => setIsLoading(false));
    };

    const cancelSale = async (sale: SaleHistoryRecord) => {
        const reason = window.prompt(`Motivo para cancelar la venta ${sale.folio}:`);
        if (reason === null) return;
        if (!reason.trim()) {
            toast.error('El motivo de cancelación es obligatorio.');
            return;
        }

        const cardStatus = sale.cardAmount > 0
            ? `Tarjeta: ${formatCurrency(sale.cardAmount)} (reembolso pendiente de procesar en la terminal).`
            : 'No hay importe pagado con tarjeta.';
        const confirmed = window.confirm(
            `Importe a devolver: ${formatCurrency(sale.total)}\n` +
            `Efectivo: ${formatCurrency(sale.cashAmount)}\n${cardStatus}\n` +
            '¿Confirmas la cancelación?',
        );
        if (!confirmed) return;

        setCancellingFolio(sale.folio);
        try {
            await salesHistoryService.cancelSale(sale.folio, reason.trim());
            toast.success(`Venta ${sale.folio} cancelada y devolución registrada.`);
        } catch (error: unknown) {
            const message = isAxiosError<{ message?: string }>(error)
                ? error.response?.data?.message
                : null;
            toast.error(message ?? 'No se pudo cancelar la venta. Verifica tu sesión y el turno abierto.');
            setCancellingFolio(null);
            return;
        }

        try {
            setStoredSales(await salesHistoryService.getSales());
        } catch {
            toast.error('La cancelación se registró, pero no se pudo actualizar el historial.');
        } finally {
            setCancellingFolio(null);
        }
    };

	return (
		<div className="history-layout">
			<Sidebar userName="_" userRole="_" />
			<main className="history-main">
				<header className="history-header"><h1>Historial de ventas</h1><p>Consulta, reimprime o cancela operaciones</p></header>
				<div className="history-body">
                    {loadError && (
                        <div className="history-error" role="alert">
                            <span>{loadError}</span>
                            <button type="button" onClick={retryLoadSales}>Reintentar</button>
                        </div>
                    )}
					<section className="history-stats" aria-label="Resumen de ventas">
						<article className="history-stat-card">
                            <span className="history-stat-icon blue">$</span>
                            <div>
                                <span>Ventas realizadas</span>
                                <strong>{activeSales.length}</strong>
                                <small>Operaciones activas</small>
                                </div>
                                </article>
                        <article className="history-stat-card">
                            <span className="history-stat-icon blue">$</span>
                            <div>
                                <span>Ventas hoy</span>
                                <strong>{formatCurrency(totalAmountToday)}</strong>
                                <small>{salesToday.length} operaciones</small>
                            </div>
                        </article>
						<article className="history-stat-card">
                            <span className="history-stat-icon green">•</span>
                            <div>
                                <span>Boletos emitidos</span>
                                <strong>{ticketCount}</strong>
                                <small>En ventas activas</small>
                                </div>
                                </article>
						<article className="history-stat-card">
                            <span className="history-stat-icon red">•</span>
                            <div>
                                <span>Cancelaciones</span>
                                <strong>{cancelledCount}</strong>
                                <small>Cancelaciones registradas</small>
                                </div>
                                </article>
					</section>
					<section className="history-panel">
						<div className="history-filters">
							<label className="history-search">
                                <span>Buscar</span>
                                <Search size={16} aria-hidden="true" />
                                <input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Folio o forma de pago..." /></label>
							<div className="history-date-filter">
                                <span>Fecha</span>
                                <ReservationCalendar
                                    value={date}
                                    markedDates={markedDates}
                                    variant="sales"
                                    onChange={(value) => { setDate(value); setPage(1); }}
                                />
                            </div>
							<label>
                                <span>Estado</span>
                                <select value={status} onChange={(event) => updateStatus(event.target.value)}>
                                    <option>Todos</option>
                                    <option>Activo</option>
                                    <option>Cancelado</option>
                                    </select>
                                    </label>
							<button className="export-button" type="button">
                                <Download size={16} /> Exportar reporte</button>
						</div>
						<div className="history-table-wrap">
							<table className="history-table">
								<thead>
                                    <tr>
                                        <th>Folio</th>
                                        <th>Hora</th>
                                        <th>Boletos</th>
                                        <th>Pago</th>
                                        <th>Total</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                        </tr>
                                        </thead>
                                <tbody>{pageSales.map((sale) => <tr key={sale.folio}>
                                    <td className="sale-folio">{sale.folio}</td>
                                    <td>{sale.time}</td>
                                    <td>{sale.tickets}</td>
                                    <td>{sale.payment}</td>
                                    <td>{formatCurrency(sale.total)}</td>
                                    <td>
                                        <span className={`sale-status ${sale.status === 'Activo' ? 'active' : 'cancelled'}`}>{sale.status}</span>
                                        {sale.refund && (
                                            <small className="sale-refund-status">
                                                {sale.refund.status === 'PENDING_CARD'
                                                    ? `Tarjeta pendiente · ${formatCurrency(sale.refund.cardAmount)}`
                                                    : `Devolución registrada · ${formatCurrency(sale.refund.amount)}`}
                                            </small>
                                        )}
                                    </td>
                                    <td>{(user?.role === 'ADMIN' || user?.role === 'CASHIER') && sale.status === 'Activo' && (
                                        <button
                                            className="action-button action-button--cancel"
                                            type="button"
                                            disabled={cancellingFolio !== null}
                                            onClick={() => void cancelSale(sale)}
                                        >
                                            {cancellingFolio === sale.folio ? 'Cancelando…' : 'Cancelar'}
                                        </button>
                                    )}</td></tr>)}</tbody>
							</table>
                            {isLoading && <p className="empty-state" role="status">Cargando ventas…</p>}
                            {!isLoading && !loadError && visibleSales.length === 0 && <p className="empty-state">No hay ventas registradas.</p>}
						</div>
						<footer className="history-footer">
                            <span>{visibleSales.length === 0 ? 'Sin ventas para mostrar' : `Mostrando ${firstResult}-${lastResult} de ${visibleSales.length} ventas`}</span><nav className="pagination" aria-label="Paginación">
                                <button type="button" aria-label="Página anterior" disabled={currentPage <= 1} onClick={() => setPage((current) => current - 1)}>
                                    <ChevronLeft size={15} />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" className={pageNumber === currentPage ? 'current' : ''} onClick={() => setPage(pageNumber)}>{pageNumber}</button>)}
                                    <button type="button" aria-label="Página siguiente" disabled={currentPage === 0 || currentPage >= totalPages} onClick={() => setPage((current) => current + 1)}>
                                        <ChevronRight size={15} />
                                        </button>
                                        </nav>
                                        </footer>
					</section>
				</div>
			</main>
		</div>
	);
};

export default SalesHistory;