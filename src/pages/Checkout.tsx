import React, { useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/SideBarBox';
import { useAuth } from '../context/AuthContext';
import type { SaleDraft } from '../types/boxOffice';
import { salesHistoryService } from '../services/sales-history.service';
import type { SaleResponse } from '../services/sales-history.service';
import './Checkout.css';

interface PaymentMethod {
  key: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  color: string;
}

//Información del ticket al finalizar el cobro, se trae la fecha,
//el total de la compra y también el cambio en dado caso de que se haya pagado demás.
interface SavedReceipt {
  date: string;
  ticketTypes: { name: string; quantity: number }[];
  quantity: number;
  change: number;
  folio: string;
  total: number;
  cashAmount: number;
  cardAmount: number;
  visitDate: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { key: 'efectivo', label: 'Efectivo', detail: 'Cambio automático', icon: Banknote, color: 'var(--color-success)' },
  { key: 'tarjeta', label: 'Tarjeta', detail: 'Crédito o débito', icon: CreditCard, color: 'var(--color-primary)' },
  { key: 'mixto', label: 'Pago mixto', detail: 'Combina formas de pago', icon: Wallet, color: 'var(--color-warning)' },
];

//Validación de formato es opcional c:
function formatPrice(price: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(price);
}

function roundToCents(amount: number) {
  return Math.round(amount * 100) / 100;
}

function getSaleErrorMessage(error: unknown) {
  if (isAxiosError<{ message?: string; detail?: string }>(error)) {
    return error.response?.data?.message
      ?? error.response?.data?.detail
      ?? 'No se pudo registrar la venta. Verifica tu sesión, el turno y la conexión e inténtalo de nuevo.';
  }
  return 'No se pudo registrar la venta. Verifica tu sesión, el turno y la conexión e inténtalo de nuevo.';
}

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  const [mixedCashAmount, setMixedCashAmount] = useState('');
  //Constantes para el ticket y error al generar el ticket.
  const [receipt, setReceipt] = useState<SavedReceipt | null>(null);
  const [chargeError, setChargeError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);


  /*El navegador abre el dialogo de impresión. Desde ahí el usuario puede 
  seleccionar una impresora o "Guardar como PDF".*/
  useEffect(() => {
    if (!receipt) return;

    const handleAfterPrint = () => {
      navigate('/taquilla/saleComplete', {
        replace: true,
        state: {
          folio: receipt.folio,
          ticketCount: String(receipt.quantity),
          ticketType: receipt.ticketTypes
            .map(({ name, quantity }) => `${name} (${quantity})`)
            .join(', '),
          totalPaid: receipt.total.toFixed(2),
          visitDate: receipt.visitDate,
          status: 'Pagada',
          receipt,
        },
      });
    };

    window.addEventListener('afterprint', handleAfterPrint, { once: true });
    window.print();
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [navigate, receipt]);
  
  const draft = location.state as SaleDraft | null;
  const hasSaleDraft = draft != null && Array.isArray(draft.items) && draft.items.length > 0;
  const userName = user?.sub ?? '';
  const userRole = user?.role === 'ADMIN' ? 'Administrador' : user?.role ?? '';

  if (!hasSaleDraft) {
    return (
      <div className="layout-container">
        <Sidebar userName={userName} userRole={userRole} />
        <main className="main-container">
          <header className="header-title">
            <h1>Cobro</h1>
            <p>No hay una venta seleccionada.</p>
          </header>
          <section className="form-card checkout-empty">
            <p>Selecciona tarifas y cantidades antes de continuar al cobro.</p>
            <button type="button" className="btn-primary" onClick={() => navigate('/taquilla/newSale')}>
              Ir a nueva venta
            </button>
          </section>
        </main>
      </div>
    );
  }

  const saleItems = draft.items;
  const ticketCount = saleItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  //Si receivedAmount está vacío, asigna NaN, que significa que el valor no es un número válido para el cálculo.
 //Si tiene un valor, lo convierte a número mediante Number(). Hace la operación del cambio
  const received = receivedAmount === '' ? Number.NaN : Number(receivedAmount);
  const mixedCash = mixedCashAmount === '' ? Number.NaN : Number(mixedCashAmount);
  const roundedMixedCash = Number.isFinite(mixedCash) ? roundToCents(mixedCash) : Number.NaN;
  const mixedCard = Number.isFinite(roundedMixedCash)
    ? roundToCents(total - roundedMixedCash)
    : Number.NaN;
  const isSaleAmountValid = saleItems.every(
    (item) =>
      Number.isInteger(item.quantity) &&
      item.quantity > 0 &&
      Number.isFinite(item.unitPrice) &&
      item.unitPrice >= 0,
  ) && Number.isFinite(total) && total >= 0;
  const isReceivedAmountValid = selectedMethod === 'efectivo'
    ? Number.isFinite(received) && received >= total
    : selectedMethod === 'tarjeta'
      ? true
      : selectedMethod === 'mixto'
      ? Number.isFinite(roundedMixedCash)
        && roundedMixedCash > 0
        && roundToCents(mixedCard) > 0
      : false;
  const cashAmount = selectedMethod === 'efectivo'
    ? roundToCents(total)
    : selectedMethod === 'mixto' && Number.isFinite(roundedMixedCash) ? roundedMixedCash : 0;
  const cardAmount = selectedMethod === 'tarjeta'
    ? roundToCents(total)
    : selectedMethod === 'mixto' && Number.isFinite(mixedCard) ? mixedCard : 0;
  const calculatedChange = selectedMethod === 'efectivo' && Number.isFinite(received)
    ? Math.max(received - total, 0)
    : 0;
  const visitDate = new Date(`${draft.visitDate}T00:00:00`).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  //Validación del cobro de venta y guarda un recibo y lo imprime.
  // También verifica que la venta sea válida antes de continuar y muestra un error si no logra guardar el recibo.
  const canCharge = isSaleAmountValid && selectedMethod !== null && isReceivedAmountValid;

  const handleChargeAndPrint = async () => {
    if (!canCharge) return;

    if (receipt) {
      window.print();
      return;
    }
    const ticketTypes = saleItems.reduce<SavedReceipt['ticketTypes']>((types, item) => {
      const existingType = types.find(({ name }) => name === item.visitorTypeName);
      if (existingType) {
        existingType.quantity += item.quantity;
      } else {
        types.push({ name: item.visitorTypeName, quantity: item.quantity });
      }
      return types;
    }, []);

    setIsSaving(true);
    try {
      const savedSale: SaleResponse = await salesHistoryService.createSale({
        visitDate: draft.visitDate,
        paymentMethod: selectedMethod === 'efectivo'
          ? 'CASH'
          : selectedMethod === 'tarjeta' ? 'CARD' : 'MIXED',
        cashAmount,
        cardAmount,
        items: saleItems.map(({ tariffId, quantity }) => ({ tariffId, quantity })),
      });
      const createdAt = new Date(savedSale.createdAt);
      const savedReceipt: SavedReceipt = {
        date: createdAt.toLocaleDateString('es-MX'),
        ticketTypes,
        quantity: savedSale.ticketCount,
        change: calculatedChange,
        folio: savedSale.folio,
        total: savedSale.total,
        cashAmount: savedSale.cashAmount,
        cardAmount: savedSale.cardAmount,
        visitDate,
      };
      setChargeError(null);
      setReceipt(savedReceipt);
    } catch (error) {
      setChargeError(getSaleErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelSale = async () => {
    let cancellationReason: string | null = null;
    if (receipt) {
      const enteredReason = window.prompt("Ingresa el motivo de cancelación.");
      if (enteredReason === null) return;
      cancellationReason = enteredReason.trim();
      if (!cancellationReason) {
        setChargeError("El motivo de cancelación es obligatorio.");
        return;
      }
      const cardStatus = receipt.cardAmount > 0
        ? `Tarjeta: ${formatPrice(receipt.cardAmount)} (reembolso pendiente de procesar en la terminal).`
        : "Sin reembolso de tarjeta.";
      if (!window.confirm(
        `Folio ${receipt.folio}\nImporte a devolver: ${formatPrice(receipt.total)}\n` +
        `Efectivo: ${formatPrice(receipt.cashAmount)}\n${cardStatus}\n¿Confirmar cancelación?`,
      )) return;
    }

    setIsSaving(true);
    try {
      if (receipt) {
        await salesHistoryService.cancelSale(receipt.folio, cancellationReason ?? "");
      } else {
        await salesHistoryService.createCancellation({
          visitDate: draft.visitDate,
          items: saleItems.map(({ tariffId, quantity }) => ({ tariffId, quantity })),
        });
      }
      navigate('/taquilla/dashboard');
    } catch {
      setChargeError('No se pudo registrar la cancelación en el servidor. Verifica tu sesión, el turno y la conexión e inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="layout-container">
      <Sidebar userName={userName} userRole={userRole} />

        <main className="main-container">
          <header className="header-title">
            <h1>Cobro</h1>
            <p>Confirma el total y registra la forma de pago</p>
          </header>

          <div className="checkout-grid">
            <section className="form-card">
              <div className="section-block">
                <h3>Detalle de la venta</h3>
                <span className="sale-meta">{ticketCount} boletos · Visita {visitDate}</span>
              </div>

              <div className="sale-items">
                {saleItems.map((item) => (
                  <div key={item.tariffId} className="sale-item-row">
                    <span className="sale-item-label">{item.visitorTypeName} · {item.activityName}</span>
                    <span className="sale-item-qty">{item.quantity}</span>
                    <span className="sale-item-unit">{formatPrice(item.unitPrice)}</span>
                    <span className="sale-item-total">{formatPrice(item.quantity * item.unitPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="total-box">
                <small>Total a cobrar</small>
                <strong>{formatPrice(total)}</strong>
              </div>

              <div className="section-block">
                <h3>Datos opcionales del visitante</h3>

                <div className="inputs-row">
                  <div className="input-group">
                    <label>Nombre</label>
                    <input type="text" placeholder="Nombre completo" />
                  </div>

                  <div className="input-group">
                    <label>Correo</label>
                    <input type="email" placeholder="correo@ejemplo.com" />
                  </div>
                </div>

                <div className="input-group">
                  <label>Código promocional</label>
                  <input type="text" placeholder="Agregar código..." />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-link"
                  disabled={isSaving}
                  onClick={() => {
                    if (isSaving) return;
                    navigate('/taquilla/newSale', { state: draft });
                  }}
                >
                  Volver
                </button>
                <button type="button" className="btn-link btn-danger" disabled={isSaving} onClick={handleCancelSale}>
                  Cancelar venta
                </button>
              </div>
            </section>

            <aside className="summary-card">
            <h3>Forma de pago</h3>

            <div className="payment-methods">
              {PAYMENT_METHODS.map(({ key, label, detail, icon: Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  disabled={receipt !== null || isSaving}
                  className={`payment-option ${selectedMethod === key ? 'payment-option-selected' : ''}`}
                  onClick={() => {
                    setSelectedMethod(key);
                    setReceivedAmount('');
                    setMixedCashAmount('');
                  }}
                >
                  <div className="payment-icon" style={{ backgroundColor: color }}>
                    <Icon size={20} color="#ffffff" />
                  </div>

                  <div className="payment-text">
                    <h4>{label}</h4>
                    <span className="payment-detail">{detail}</span>
                  </div>

                  <span className={`radio-dot ${selectedMethod === key ? 'radio-dot-checked' : ''}`} />
                </button>
              ))}
            </div>
             
            {/*Si el método de pago es efectivo o mixto, se muestra un campo para ingresar la cantidad recibida.*/}
            {(selectedMethod === 'efectivo' || selectedMethod === 'mixto') && (
              <div className="input-group">
                {selectedMethod === 'efectivo' ? (
                  <>
                    <label htmlFor="received-amount">Cantidad recibida</label>
                    <input
                      id="received-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={receivedAmount}
                      disabled={receipt !== null || isSaving}
                      onChange={(event) => setReceivedAmount(event.target.value)}
                      placeholder="$0.00"
                      aria-invalid={receivedAmount !== '' && !isReceivedAmountValid}
                    />
                    {receivedAmount !== '' && !isReceivedAmountValid && (
                      <small className="payment-validation-message">
                        La cantidad recibida debe ser mayor o igual al total a cobrar.
                      </small>
                    )}
                  </>
                ) : (
                  <div className="mixed-payment-fields">
                    <div className="input-group">
                      <label htmlFor="mixed-cash-amount">Pago en efectivo</label>
                      <input
                        id="mixed-cash-amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={mixedCashAmount}
                        disabled={receipt !== null || isSaving}
                        onChange={(event) => setMixedCashAmount(event.target.value)}
                        placeholder="$0.00"
                        aria-invalid={mixedCashAmount !== '' && !isReceivedAmountValid}
                      />
                    </div>
                    <div className="input-group">
                      <label htmlFor="mixed-card-amount">Pago con tarjeta (restante)</label>
                      <input
                        id="mixed-card-amount"
                        type="number"
                        value={Number.isFinite(mixedCard) && mixedCard > 0 ? mixedCard.toFixed(2) : ''}
                        disabled
                        readOnly
                        aria-label="Importe restante que se cobrará a tarjeta"
                      />
                    </div>
                    <small>El pago con tarjeta cubre el importe restante.</small>
                    {mixedCashAmount !== '' && !isReceivedAmountValid && (
                      <small className="payment-validation-message">
                        El pago en efectivo debe ser mayor que cero y menor que el total.
                      </small>
                    )}
                  </div>
                )}
              </div>
            )}
            {selectedMethod === 'tarjeta' && (
              <div className="change-box">
                <small>Se cobrará a tarjeta</small>
                <strong>{formatPrice(total)}</strong>
              </div>
            )}
            {/*Si el método de pago es efectivo, se muestra el cambio calculado.*/}
            {selectedMethod === 'efectivo' && (
              <div className="change-box">
                <small>Cambio</small>
                <strong>{formatPrice(calculatedChange)}</strong>
              </div>
            )}

            {chargeError && <p className="checkout-error" role="alert">{chargeError}</p>}
            <button type="button" className="btn-primary" disabled={!canCharge || isSaving} onClick={handleChargeAndPrint}>
              {isSaving ? 'Registrando…' : receipt ? 'Imprimir ticket' : 'Imprimir y cobrar'}
            </button>
          </aside>
        </div>
        {/*Se muestra el recibo de venta si se ha generado un recibo, con la fecha, tipo de entradas, cantidad y cambio.*/}
        {receipt && (
          <section className="checkout-receipt" aria-label="Recibo de la venta">
            <h1>Recibo de venta</h1>
            <p><strong>Fecha:</strong> {receipt.date}</p>
            <div>
              <strong>Tipo de entradas:</strong>
              {receipt.ticketTypes.map(({ name, quantity }) => (
                <p key={name}>{name}: {quantity}</p>
              ))}
            </div>
            <p><strong>Cantidad:</strong> {receipt.quantity}</p>
            <p><strong>Cambio:</strong> {formatPrice(receipt.change)}</p>
          </section>
        )}
      </main>
    </div>
  );
};

export default Checkout;
