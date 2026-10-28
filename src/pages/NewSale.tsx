import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { Sidebar } from '../components/SideBarBox';
import { TICKET_TYPES } from '../data/ticketTypes';
import { useAuth } from '../context/AuthContext';
import { catalogService, type Tariff } from '../services/catalog.service';
import type { SaleDraft } from '../types/boxOffice';
import './NewSale.css';

function getToday() {
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

function formatPrice(price: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

//Datos de backend para las tarifas
export const NewSale = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const existingDraft = (location.state as SaleDraft | null) ?? null;
  const [visitDate, setVisitDate] = useState(existingDraft?.visitDate ?? getToday());
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(existingDraft?.items.map(({ tariffId, quantity }) => [tariffId, quantity]) ?? []),
  );
  const [isLoadingTariffs, setIsLoadingTariffs] = useState(true);
  const [tariffsError, setTariffsError] = useState<string | null>(null);

  const fetchTariffs = useCallback(() => catalogService.getTariffs(), []);

  useEffect(() => {
    let isActive = true;

    fetchTariffs()
      .then((loadedTariffs) => {
        if (isActive) setTariffs(loadedTariffs);
      })
      .catch(() => {
        if (isActive) {
          setTariffsError('No se pudieron cargar las tarifas. Verifica tu sesión y la conexión con el servidor.');
        }
      })
      .finally(() => {
        if (isActive) setIsLoadingTariffs(false);
      });

    return () => {
      isActive = false;
    };
  }, [fetchTariffs]);

  const retryLoadTariffs = () => {
    setIsLoadingTariffs(true);
    setTariffsError(null);

    fetchTariffs()
      .then(setTariffs)
      .catch(() => {
        setTariffsError('No se pudieron cargar las tarifas. Verifica tu sesión y la conexión con el servidor.');
      })
      .finally(() => setIsLoadingTariffs(false));
  };

  const availableTariffs = tariffs.filter(
    ({ active, validFrom, validUntil }) =>
      active && validFrom <= visitDate && (!validUntil || validUntil >= visitDate),
  );

  const updateQuantity = (tariffId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [tariffId]: Math.max(0, (prev[tariffId] ?? 0) + delta),
    }));
  };

  const saleItems = availableTariffs
    .filter(({ id }) => (quantities[id] ?? 0) > 0)
    .map((tariff) => ({
      tariffId: tariff.id,
      visitorTypeId: tariff.visitorTypeId,
      visitorTypeName: tariff.visitorTypeName,
      activityId: tariff.activityId,
      activityName: tariff.activityName,
      quantity: quantities[tariff.id],
      unitPrice: tariff.price,
    }));
  const total = saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const ticketCount = saleItems.reduce((sum, item) => sum + item.quantity, 0);
  const categorizedTariffs = TICKET_TYPES.map((ticketType) => ({
    ticketType,
    tariffs: availableTariffs.filter(
      ({ visitorTypeName }) => getTicketType(visitorTypeName)?.key === ticketType.key,
    ),
  }));
  const unclassifiedTariffs = availableTariffs.filter(
    ({ visitorTypeName }) => !getTicketType(visitorTypeName),
  );
  const userName = user?.sub ?? '';
  const userRole = user?.role === 'ADMIN' ? 'Administrador' : user?.role ?? '';

  const continueToCheckout = () => {
    const draft: SaleDraft = { visitDate, items: saleItems };
    navigate('/taquilla/checkout', { state: draft });
  };

  //Regresa el usuario y el rol desde el backend, se remplaza por los mocks 
  return (
    <div className="layout-container">
      <Sidebar userName={userName} userRole={userRole} />

      <main className="main-content">
        <header className="header-title">
          <h1>Nueva venta</h1>
          <p>Selecciona las tarifas vigentes, cantidades y fecha de visita</p>
        </header>

        <div className="sale-grid">
          <section className="form-card">
            <div className="section-block">
              <h3>1. Fecha de visita</h3>
              <div className="input-group">
                <label htmlFor="visit-date">Fecha</label> 
                <input
                  id="visit-date"
                  type="date"
                  min={getToday()}
                  value={visitDate}
                  onChange={(event) => setVisitDate(event.target.value)}
                />
              </div>
            </div>

            <div className="section-block">
              <h3>2. Tipos de boleto</h3>

              <div className="tickets-list">
                {isLoadingTariffs && <p className="sale-state" role="status">Cargando tarifas…</p>}
                {tariffsError && (
                  <div className="sale-error" role="alert">
                    <p>{tariffsError}</p>
                    <button type="button" onClick={retryLoadTariffs}>Reintentar</button>
                  </div>
                )}

                {categorizedTariffs.map(({ ticketType, tariffs: typeTariffs }) => {
                  const Icon = ticketType.icon;

                  return (
                    <article className="ticket-card ticket-category-card" key={ticketType.key}>
                      <div className="ticket-info">
                        <div className="ticket-icon" style={{ backgroundColor: ticketType.color }}>
                          <Icon size={20} color="#ffffff" />
                        </div>
                        <div className="ticket-text">
                          <h4>{ticketType.label}</h4>
                          <span className="ticket-detail">{ticketType.detail}</span>
                        </div>
                      </div>

                      {/* Se agregan las tarifas con información del backend y se quitaron los mocks para el cálculo de tickets en venta. */}

                      {typeTariffs.length > 0 ? (
                        <div className="ticket-category-options">
                          {typeTariffs.map((tariff) => (
                            <div className="ticket-option" key={tariff.id}>
                              <span className="ticket-detail">{tariff.activityName}</span>
                              <div className="ticket-controls">
                                <span className="ticket-price" style={{ color: ticketType.color }}>
                                  {formatPrice(tariff.price)}
                                </span>
                                <div className="counter-box">
                                  <button
                                    type="button"
                                    className="counter-btn counter-btn-minus"
                                    aria-label={`Reducir ${ticketType.label}`}
                                    onClick={() => updateQuantity(tariff.id, -1)}
                                    disabled={!quantities[tariff.id]}
                                  >
                                    -
                                  </button>
                                  <span>{quantities[tariff.id] ?? 0}</span>
                                  <button
                                    type="button"
                                    className="counter-btn counter-btn-plus"
                                    aria-label={`Aumentar ${ticketType.label}`}
                                    onClick={() => updateQuantity(tariff.id, 1)}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="ticket-unavailable">
                          {isLoadingTariffs
                            ? 'Consultando tarifa…'
                            : tariffsError
                              ? 'No se pudo consultar la tarifa.'
                              : 'Tarifa no configurada para esta fecha.'}
                        </p>
                      )}
                    </article>
                  );
                })}

                {unclassifiedTariffs.map((tariff) => (
                  <div key={tariff.id} className="ticket-card">
                    <div className="ticket-info">
                      <div className="ticket-icon" style={{ backgroundColor: 'var(--color-primary)' }}>
                        <Ticket size={20} color="#ffffff" />
                      </div>
                      <div className="ticket-text">
                        <h4>{tariff.visitorTypeName}</h4>
                        <span className="ticket-detail">{tariff.activityName}</span>
                      </div>
                    </div>

                    <div className="ticket-controls">
                      <span className="ticket-price">{formatPrice(tariff.price)}</span>
                      <div className="counter-box">
                        <button
                          type="button"
                          className="counter-btn counter-btn-minus"
                          aria-label={`Reducir ${tariff.visitorTypeName}`}
                          onClick={() => updateQuantity(tariff.id, -1)}
                          disabled={!quantities[tariff.id]}
                        >
                          -
                        </button>
                        <span>{quantities[tariff.id] ?? 0}</span>
                        <button
                          type="button"
                          className="counter-btn counter-btn-plus"
                          aria-label={`Aumentar ${tariff.visitorTypeName}`}
                          onClick={() => updateQuantity(tariff.id, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="summary-card">
            <h3>Resumen</h3>

            {/* En el resumen de venta se agrega el precio real de los boletos traído desde el backend. */}
            <div className="summary-items">
              {saleItems.length > 0 ? saleItems.map((item) => (
                <div className="summary-row" key={item.tariffId}>
                  <span>{item.quantity} × {item.visitorTypeName} · {item.activityName}</span>
                  <strong>{formatPrice(item.quantity * item.unitPrice)}</strong>
                </div>
              )) : <p className="sale-state">Selecciona tarifas para ver el resumen.</p>}
            </div>

            <hr className="summary-divider" />

            <div className="summary-row subtotal">
              <span>Boletos</span>
              <strong>{ticketCount}</strong>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span className="total-amount">{formatPrice(total)}</span>
            </div>

            <div className="visit-badge">
              <small>Fecha de visita</small>
              <strong>{visitDate ? new Date(`${visitDate}T00:00:00`).toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }) : 'Selecciona una fecha'}</strong>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={continueToCheckout}
              disabled={isLoadingTariffs || !!tariffsError || !visitDate || ticketCount === 0}
            >
              Continuar al cobro
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default NewSale;