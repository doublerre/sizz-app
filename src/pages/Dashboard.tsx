import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, DollarSign, Ticket, Users } from 'lucide-react';
import { Sidebar } from '../components/SideBarBox';
import { TICKET_TYPES } from '../data/ticketTypes';
import { useAuth } from '../context/AuthContext';
import { catalogService, type Tariff } from '../services/catalog.service';
import { ticketbootService, type TicketbootDashboard } from '../services/ticketboot.service';
import './Dashboard.css';

//Ser trae la información del backend y se remplazan los mocks.
const DASHBOARD_STATS = [
  { key: 'salesTotal', label: 'Ventas del turno', detail: (data: TicketbootDashboard) => `${data.salesCount} ventas`, icon: DollarSign, color: 'var(--color-primary)', format: formatPrice },
  { key: 'cashInDrawer', label: 'Efectivo en caja', detail: () => 'Fondo inicial + ventas en efectivo', icon: Banknote, color: 'var(--color-success)', format: formatPrice },
  { key: 'cardPayments', label: 'Pagos con tarjeta', detail: (data: TicketbootDashboard) => `${data.cardPaymentCount} operaciones`, icon: CreditCard, color: 'var(--color-warning)', format: formatPrice },
  { key: 'visitorsToday', label: 'Visitantes hoy', detail: () => 'Boletos con visita para hoy', icon: Users, color: 'var(--color-danger)', format: (value: number) => value.toLocaleString('es-MX') },
] as const;

//Fecha para las ventas
function getCurrentDateString() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${today.getFullYear()}-${month}-${day}`;
}

function getTicketType(visitorTypeName: string) {
  const normalizedName = visitorTypeName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_-]/g, ' ');

  if (normalizedName.includes('festival')) {
    return TICKET_TYPES.find(({ key }) => key === 'festival');
  }
  if (normalizedName.includes('mayor') || normalizedName.includes('inapam')) {
    return TICKET_TYPES.find(({ key }) => key === 'adultoMayor');
  }
  if (normalizedName.includes('infantil') || normalizedName.includes('nino')) {
    return TICKET_TYPES.find(({ key }) => key === 'infantil');
  }
  if (normalizedName.includes('adulto')) {
    return TICKET_TYPES.find(({ key }) => key === 'adulto');
  }

  return undefined;
}

//Función para formato de pesos mexicanos (es opcional se puede quitar, a revisión)
function formatPrice(price: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

//Se remplazan los mocks de sale item para el conteo de ventas, caja, efectivo, etc
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);
  const [tariffsError, setTariffsError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<TicketbootDashboard | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  //Información traida desde el catalogo.
  const fetchTariffs = useCallback(() => catalogService.getTariffs(), []);
  const fetchDashboard = useCallback(() => ticketbootService.getDashboard(), []);

  useEffect(() => {
    let isActive = true;

    //Carga las tarifas existentes en la base de datos, en dado caso no exitir niguna manda el error de tarifas inexistentes o
    //cuando no cargan de forma correcta.
    fetchTariffs()
      .then((loadedTariffs) => {
        if (isActive) setTariffs(loadedTariffs);
      })
      .catch(() => {
        if (isActive) {
          setTariffsError('No se pudieron cargar las tarifas. Verifica la conexión e inténtalo de nuevo.');
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingTariffs(false);
      });

    return () => {
      isActive = false;
    };
  }, [fetchTariffs]);

  useEffect(() => {
    let isActive = true;

    fetchDashboard()
      .then((data) => {
        if (isActive) setDashboardData(data);
      })
      .catch(() => {
        if (isActive) setDashboardError('No se pudieron cargar los datos de ventas y caja.');
      })
      .finally(() => {
        if (isActive) setIsLoadingDashboard(false);
      });

    return () => {
      isActive = false;
    };
  }, [fetchDashboard]);

  const retryLoadTariffs = () => {
    setIsLoadingTariffs(true);
    setTariffsError(null);

    fetchTariffs()
      .then(setTariffs)
      .catch(() => {
        setTariffsError('No se pudieron cargar las tarifas. Verifica la conexión e inténtalo de nuevo.');
      })
      .finally(() => setIsLoadingTariffs(false));
  };

  const retryLoadDashboard = () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);

    fetchDashboard()
      .then(setDashboardData)
      .catch(() => {
        setDashboardError('No se pudieron cargar los datos de ventas y caja.');
      })
      .finally(() => setIsLoadingDashboard(false));
  };

  const currentDate = getCurrentDateString();
  const currentTariffs = tariffs.filter(
    ({ active, validFrom, validUntil }) =>
      active && validFrom <= currentDate && (!validUntil || validUntil >= currentDate),
  );
  const ticketTypesWithTariffs = TICKET_TYPES.map((ticketType) => ({
    ticketType,
    tariffs: currentTariffs.filter(
      ({ visitorTypeName }) => getTicketType(visitorTypeName)?.key === ticketType.key,
    ),
  }));
  const unclassifiedTariffs = currentTariffs.filter(
    ({ visitorTypeName }) => !getTicketType(visitorTypeName),
  );
  const userName = user?.sub ?? '';
  const userRole = user?.role === 'ADMIN'
    ? 'Administrador'
    : user?.role === 'CASHIER'
      ? 'Taquillero'
      : user?.role ?? '';

  return (
    <div className="d-wrapper">
      {/*Se remplaza el mock de usuario por la información real del backend*/}
      <Sidebar userName={userName} userRole={userRole} />
      <main className="d-main">
        <header className="d-header">
          <div className="d-title-group">
            <h1>Punto de Venta</h1>
          </div>
          <p>
            {(() => {
              const today = new Date();
              const weekday = today.toLocaleDateString('es-ES', { weekday: 'long' });
              const date = today.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              });
              const formattedDate = `${weekday} ${date}`;
              return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
            })()}{' '}
            · Taquilla Principal
          </p>
        </header>

        {/*Verifica que la información requerida para el resumen de turno se haya cargado de forma correcta*/}
        <section className="d-stats" aria-label="Resumen del turno">
          {DASHBOARD_STATS.map(({ key, label, detail, icon: Icon, color, format }) => {
            const value = dashboardData?.[key] ?? 0;

            return (
              <article className="d-stat-card" key={key}>
                <div className="d-stat-icon" style={{ backgroundColor: color }}>
                  <Icon size={20} color="#ffffff" />
                </div>
                <div className="d-stat-info">
                  <span className="d-stat-label">{label}</span>
                  <span className="d-stat-value">
                    {isLoadingDashboard ? 'Cargando…' : dashboardError ? '—' : format(value)}
                  </span>
                  <span className="d-stat-detail">
                    {dashboardData && !dashboardError ? detail(dashboardData) : dashboardError ? 'Datos no disponibles' : 'Consultando backend'}
                  </span>
                </div>
              </article>
            );
          })}
          {dashboardError && (
            <div className="d-dashboard-error" role="alert">
              <p>{dashboardError}</p>
              <button type="button" onClick={retryLoadDashboard}>Reintentar</button>
            </div>
          )}
        </section>

        <section className="d-content">
          <section className="d-quick-sale">
            <h2 className="d-quick-sale-title">Venta Rápida</h2>
            <p className="d-subtitle">Tarifas vigentes del catálogo</p>
            <div className="d-ticket-grid">

              {/*Errores en la carga de tarifas*/}
              {tariffsError && (
                <div className="d-catalog-error" role="alert">
                  <p>{tariffsError}</p>
                  <button type="button" onClick={retryLoadTariffs}>Reintentar</button>
                </div>
              )}
              {ticketTypesWithTariffs.map(({ ticketType, tariffs: typeTariffs }) => {
                const Icon = ticketType.icon;

                return (
                  <article className="d-ticket-card" key={ticketType.key}>
                    <div className="d-ticket-icon" style={{ background: ticketType.color }}>
                      <Icon size={18} color="#ffffff" />
                    </div>
                    <div className="d-ticket-info">
                      <span className="d-ticket-label">{ticketType.label}</span>
                      {typeTariffs.length > 0 ? (
                        typeTariffs.map((tariff) => (
                          <div className="d-ticket-tariff" key={tariff.id}>
                            <span className="d-ticket-price" style={{ color: ticketType.color }}>
                              {formatPrice(tariff.price)}
                            </span>
                            <span className="d-ticket-detail">{tariff.activityName}</span>
                          </div>
                        ))
                      ) : (
                        <span className="d-ticket-detail">
                          {isLoadingTariffs
                            ? 'Consultando tarifa…'
                            : tariffsError
                              ? 'No se pudo consultar la tarifa.'
                              : 'Tarifa no configurada para hoy.'}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
              {unclassifiedTariffs.map((tariff) => (
                <article className="d-ticket-card" key={tariff.id}>
                  <div className="d-ticket-icon" style={{ background: 'var(--color-primary)' }}>
                    <Ticket size={18} color="#ffffff" />
                  </div>
                  <div className="d-ticket-info">
                    <span className="d-ticket-label">{tariff.visitorTypeName}</span>
                    <span className="d-ticket-price">
                      {formatPrice(tariff.price)}
                    </span>
                    <span className="d-ticket-detail">{tariff.activityName}</span>
                  </div>
                </article>
              ))}
            </div>
            <button className="d-btn-newsale" type="button" onClick={() => navigate('/taquilla/newsale')}>
              Iniciar nueva venta
            </button>
          </section>

          {/*Validación del turno, se verifica que el turno se haya abierto con un usuario existente y marca si el turno
          sigue abierto o ya ha cerrado*/}
          <aside className="d-shift-panel">
            <h2>Turno abierto</h2>
            <span className={`d-shift-badge ${dashboardData?.activeShift ? 'is-open' : ''}`}>
              {isLoadingDashboard
                ? 'Consultando…'
                : dashboardError
                  ? 'No disponible'
                  : dashboardData?.activeShift
                    ? 'Abierto'
                    : 'Sin turno abierto'}
            </span>
            
            {/*Validación de turno*/}
            {dashboardData?.activeShift && !dashboardError ? (
              <div className="d-shift-group">
                <div className="d-shift-field">
                  <span className="d-shift-label">Cajero</span>
                  <span className="d-shift-value">{dashboardData.activeShift.cashierName ?? 'Sin nombre registrado'}</span>
                </div>
                <div className="d-shift-field">
                  <span className="d-shift-label">Apertura</span>
                  <span className="d-shift-value">
                    {new Date(dashboardData.activeShift.openedAt).toLocaleString('es-MX')}
                  </span>
                </div>
                <div className="d-shift-field">
                  <span className="d-shift-label">Fondo inicial</span>
                  <span className="d-shift-value d-fund">{formatPrice(dashboardData.activeShift.openingAmount)}</span>
                </div>
              </div>
            ) : (
              <p className="d-shift-empty">
                {dashboardError
                  ? 'No fue posible consultar el turno.'
                  : isLoadingDashboard
                    ? 'Cargando información del turno…'
                    : 'No hay un turno abierto asociado a tu usuario.'}
              </p>
            )}
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;