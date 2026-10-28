import React, { useState } from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/SideBarBox';
import { useAuth } from '../context/AuthContext';
import type { SaleDraft } from '../types/boxOffice';
import './Checkout.css';

interface PaymentMethod {
  key: string;
  label: string;
  detail: string;
  icon: React.ElementType;
  color: string;
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

export const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');
  
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
  const received = Number.parseFloat(receivedAmount) || 0;
  const isCashPayment = selectedMethod === 'efectivo';
  const isReceivedAmountValid = !isCashPayment || received >= total;
  const calculatedChange = Math.max(received - total, 0);
  const visitDate = new Date(`${draft.visitDate}T00:00:00`).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
                <button type="button" className="btn-link" onClick={() => navigate('/taquilla/newSale', { state: draft })}>
                  Volver
                </button>
                <button type="button" className="btn-link btn-danger" onClick={() => navigate('/taquilla/dashboard')}>
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
                  className={`payment-option ${selectedMethod === key ? 'payment-option-selected' : ''}`}
                  onClick={() => setSelectedMethod(key)}
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
             
            <div className="input-group">
              <label>Recibido</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={receivedAmount}
                onChange={(event) => setReceivedAmount(event.target.value)}
                placeholder="$0.00"
                aria-invalid={isCashPayment && !isReceivedAmountValid}
              />
              {isCashPayment && !isReceivedAmountValid && (
                <small className="payment-validation-message">
                  El efectivo recibido debe ser mayor o igual al total a cobrar.
                </small>
              )}
            </div>

            <div className="change-box">
              <small>Cambio</small>
              <strong>{formatPrice(calculatedChange)}</strong>
            </div>

            <p className="checkout-pending" role="status">
              El registro del cobro estará disponible cuando se implemente el servicio de ventas.
            </p>
            <button type="button" className="btn-primary" disabled>
              Cobrar e imprimir
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
