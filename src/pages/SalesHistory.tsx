import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, MoreHorizontal, Search } from 'lucide-react';
import { Sidebar } from '../components/SideBarBox';
import './SalesHistory.css';

/*Estructura del backend cuando exista la integración.*/
interface Sale {
	folio: string;
	time: string;
	tickets: number;
	payment: string;
	total: number;
	status: 'Activo' | 'Cancelado';
}

/*formato dinero mx*/
const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-MX')}`;

/*fecha del sistema */
const formatDate = (date: Date) => date.toLocaleDateString('es-MX');


interface SalesHistoryProps {
    sales?: Sale[];
}

export const SalesHistory = ({ sales = [] }: SalesHistoryProps) => {
	const [search, setSearch] = useState('');
	const [status, setStatus] = useState('Todos');
    const [page, setPage] = useState(1);
    const pageSize = 5;


    const visibleSales = useMemo(() => sales.filter((sale) => {
		const matchesSearch = `${sale.folio} ${sale.payment}`.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = status === 'Todos' || sale.status === status;
		return matchesSearch && matchesStatus;
    }), [sales, search, status]);

    //cantidad de páginas se calcula con las ventas filtradas y el tamaño de página.
    const totalPages = Math.ceil(visibleSales.length / pageSize);
    const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages);
    const pageSales = visibleSales.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const firstResult = visibleSales.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const lastResult = Math.min(currentPage * pageSize, visibleSales.length);

    // tarjetas resumen - datos recibidos.
    const totalAmount = sales.reduce((sum, sale) => sum + sale.total, 0);
    const ticketCount = sales.reduce((sum, sale) => sum + sale.tickets, 0);
    const cancelledCount = sales.filter((sale) => sale.status === 'Cancelado').length;
    const today = formatDate(new Date());

    // Al cambiar un filtro, la tabla vuelve a la primera página para evitar páginas vacías.
    const updateSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const updateStatus = (value: string) => {
        setStatus(value);
        setPage(1);
    };

	return (
		<div className="history-layout">
			<Sidebar userName="_" userRole="_" />
			<main className="history-main">
				<header className="history-header"><h1>Historial de ventas</h1><p>Consulta, reimprime o cancela operaciones</p></header>
				<div className="history-body">
					<section className="history-stats" aria-label="Resumen de ventas">
						<article className="history-stat-card">
                            <span className="history-stat-icon blue">$</span>
                            <div>
                                <span>Ventas hoy</span>
                                <strong>{sales.length === 0 ? '-' : formatCurrency(totalAmount)}</strong>
                                <small>{sales.length === 0 ? '-' : `${sales.length} operaciones`}</small>
                                </div>
                                </article>
						<article className="history-stat-card">
                            <span className="history-stat-icon green">•</span>
                            <div>
                                <span>Boletos emitidos</span>
                                <strong>{sales.length === 0 ? '-' : ticketCount}</strong>
                                <small>{sales.length === 0 ? '-' : 'Boletos emitidos'}</small>
                                </div>
                                </article>
						<article className="history-stat-card">
                            <span className="history-stat-icon red">•</span>
                            <div>
                                <span>Cancelaciones</span>
                                <strong>{sales.length === 0 ? '-' : cancelledCount}</strong>
                                <small>{sales.length === 0 ? '-' : 'Cancelaciones registradas'}</small>
                                </div>
                                </article>
					</section>
					<section className="history-panel">
						<div className="history-filters">
							<label className="history-search">
                                <span>Buscar</span>
                                <Search size={16} aria-hidden="true" />
                                <input value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="Folio, nombre o correo..." /></label>
							<label>
                                <span>Fecha</span>
                                <input type="text" value={today} readOnly />
                                </label>
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
                                    <td><span className={`sale-status ${sale.status === 'Activo' ? 'active' : 'cancelled'}`}>{sale.status}</span></td><td><button className="action-button" type="button" aria-label={`Más acciones para ${sale.folio}`}><MoreHorizontal size={18} /></button></td></tr>)}</tbody>
							</table>
                            {visibleSales.length === 0 && <p className="empty-state">No hay ventas registradas.</p>}
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