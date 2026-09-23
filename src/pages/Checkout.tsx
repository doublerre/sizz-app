import React, { useState } from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/SideBarBox';
import './Checkout.css';

interface SaleItem{
  label: string;
  quantity: string;
  unitPrice: string;
  total: string;
}

interface CheckoutProps{
  saleItems?: SaleItem[];
  ticketCount?: string;
  visitDate?: string;
  totalToCharge?: string;
  changeAmount?: string;
}

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

export const Checkout = ({
  saleItems = [],
  ticketCount = '_',
  visitDate = '_',
  totalToCharge = '_',
  changeAmount = '_',
}: CheckoutProps) => {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [receivedAmount, setReceivedAmount] = useState('');

  const total = Number.parseFloat(totalToCharge.replace(/[^\d.-]/g, '')) || 0;
  const received = Number.parseFloat(receivedAmount) || 0;
  const calculatedChange = Math.max(received - total, 0);
  const displayedChange = receivedAmount ? `$${calculatedChange.toFixed(2)}` : changeAmount;

  return (
    <div className="layout-container">
      <Sidebar userName="_" userRole="_" />

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
                {saleItems.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="sale-item-row">
                    <span className="sale-item-label">{item.label}</span>
                    <span className="sale-item-qty">{item.quantity}</span>
                    <span className="sale-item-unit">{item.unitPrice}</span>
                    <span className="sale-item-total">{item.total}</span>
                  </div>
                ))}
              </div>

              <div className="total-box">
                <small>Total a cobrar</small>
                <strong>{totalToCharge}</strong>
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
                <button type="button" className="btn-link" onClick={() => navigate('/taquilla/newSale')}>
                  Volver
                </button>
                <button type="button" className="btn-link btn-danger" onClick={() => window.history.back()}>
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
                  <div className="payment-info">
                    <div className="payment-icon" style={{ backgroundColor: color }}>
                      <Icon size={20} color="#ffffff" />
                    </div>

                    <div className="payment-text">
                      <h4>{label}</h4>
                      <span className="payment-detail">{detail}</span>
                    </div>
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
              />
            </div>

            <div className="change-box">
              <small>Cambio</small>
              <strong>{displayedChange}</strong>
            </div>

            <button type="button" className="btn-primary" disabled={!selectedMethod}>
              Cobrar e imprimir
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
