import { useState } from 'react';
import { Banknote, ClipboardList, CreditCard, Gift, Wallet, X } from 'lucide-react';
import { Sidebar } from '../components/SideBarBox';
import './CashClosing.css';

const EXPECTED_CASH = 4120;

const money = (value: number) =>
  value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const summaryCards = [
  { label: 'Venta bruta', value: '$ 8,700', tone: 'blue', icon: ClipboardList },
  { label: 'Cancelaciones', value: '- $ 240', tone: 'red', icon: X },
  { label: 'Venta neta', value: '$ 8,460', tone: 'green', icon: Wallet },
];

const paymentBreakdown = [
  { method: 'Efectivo', amount: '$4,120', icon: Banknote, tone: 'green' },
  { method: 'Tarjeta', amount: '$4,340', icon: CreditCard, tone: 'blue' },
  { method: 'Cortesías', amount: '$0', icon: Gift, tone: 'yellow' },
];

export default function CashClosing() {
  const [counted, setCounted] = useState(String(EXPECTED_CASH));

  const countedNumber = Number(counted.replace(/,/g, '')) || 0;
  const difference = countedNumber - EXPECTED_CASH;
  const differenceTone = difference === 0 ? 'ok' : 'alert';

  return (
    <div className="cash-closing-page">
      <Sidebar userName="_" userRole="_" />

      <div className="cash-closing-main">
        <header className="cash-closing-header">
          <h1>Corte de caja</h1>
          <p>Revisa el turno antes de cerrarlo</p>
        </header>

        <div className="cash-closing-body">
          <div className="cash-closing-layout">
            <section className="cash-closing-panel" aria-label="Resumen del turno">
              <h2 className="cash-closing-section-title">Resumen del turno</h2>
              <p className="cash-closing-date">13 agosto 2026 · 09:02–17:48</p>

              <div className="cash-summary-grid">
                {summaryCards.map(({ label, value, tone, icon: Icon }) => (
                  <div key={label} className="cash-summary-card">
                    <span className={`cash-icon cash-icon--lg cash-icon--${tone}`}>
                      <Icon size={22} strokeWidth={2.5} />
                    </span>
                    <div className="cash-summary-copy">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  </div>
                ))}
              </div>

              <h3 className="cash-breakdown-title">Desglose por forma de pago</h3>

              <div className="cash-payment-list">
                {paymentBreakdown.map(({ method, amount, icon: Icon, tone }) => (
                  <div key={method} className="cash-payment-row">
                    <div className="cash-payment-label">
                      <span className={`cash-icon cash-icon--${tone}`}>
                        <Icon size={18} />
                      </span>
                      <span>{method}</span>
                    </div>
                    <strong className={`cash-amount cash-amount--${tone}`}>{amount}</strong>
                  </div>
                ))}
              </div>

              <h3 className="cash-breakdown-title">Conteo físico de efectivo</h3>

              <div className="cash-count">
                <label className="cash-count-field">
                  <span>Efectivo contado</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={counted === '' ? '' : `$ ${counted}`}
                    onChange={(event) => setCounted(event.target.value.replace(/[^0-9.,]/g, ''))}
                    onBlur={() => counted !== '' && setCounted(money(countedNumber))}
                  />
                </label>

                <div className={`cash-difference cash-difference--${differenceTone}`}>
                  <span>Diferencia</span>
                  <strong>
                    {difference < 0 ? '- ' : ''}$ {money(Math.abs(difference))}
                  </strong>
                </div>
              </div>
            </section>

            <aside className="cash-closing-sidebar-card" aria-label="Cierre de turno">
              <h2>Cierre de turno</h2>

              <div className="cash-closing-stat">
                <span>Ventas</span>
                <strong>42</strong>
              </div>
              <div className="cash-closing-stat">
                <span>Boletos</span>
                <strong>76</strong>
              </div>
              <div className="cash-closing-stat cash-closing-stat--total">
                <span>Total neto</span>
                <strong>$8,460</strong>
              </div>

              <div className="cash-closing-observations">
                <label htmlFor="cash-notes">Observaciones</label>
                <input id="cash-notes" type="text" defaultValue="Sin incidencias" />
              </div>

              <button type="button" className="cash-close-button">
                Cerrar turno
              </button>

              <p className="cash-close-note">Se generará el reporte de corte.</p>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}