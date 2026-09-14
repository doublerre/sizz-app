import React, { useState } from 'react';
import { User, Users, Accessibility, Sun } from 'lucide-react';
import { Sidebar } from '../components/SideBarBox';
import './NewSale.css';

interface TicketConfig {
  key: string;
  label: string;
  detail: string;
  color: string;
  icon: React.ElementType;
}

const TICKETS_CONFIG: TicketConfig[] = [
  { key: 'adulto', label: 'Entrada general adulto', detail: 'Acceso general · 18+', color: 'var(--color-primary)', icon: User },
  { key: 'infantil', label: 'Entrada general infantil', detail: 'De 3 a 17 años', color: 'var(--color-success)', icon: Users },
  { key: 'adultoMayor', label: 'Adulto mayor', detail: 'Con identificación vigente', color: 'var(--color-warning)', icon: Accessibility },
  { key: 'festival', label: 'Festival de verano', detail: 'Especial de temporada', color: 'var(--color-danger)', icon: Sun },
];

export const NewSale = () => {
  const [quantities, setQuantities] = useState<Record<string, number>>({
    adulto: 0,
    infantil: 0,
    adultoMayor: 0,
    festival: 0,
  });

  const updateQuantity = (key: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(0, prev[key] + delta),
    }));
  };

  return (
    <div className="layout-container">
      <Sidebar userName="_" userRole="_" />

      <main className="main-content">
        <header className="header-title">
          <h1>Nueva venta</h1>
          <p>Selecciona boletos, cantidades y fecha de visita</p>
        </header>

        <div className="sale-grid">
          <section className="form-card">
            <div className="section-block">
              <h3>1. Fecha de visita</h3>

              <div className="inputs-row">
                <div className="input-group">
                  <label>Fecha</label>
                  <input type="text" value="_" readOnly />
                </div>

                <div className="input-group">
                  <label>Horario</label>
                  <input type="text" value="_" readOnly />
                </div>
              </div>
            </div>

            <div className="section-block">
              <h3>2. Boletos disponibles</h3>

              <div className="tickets-list">
                {TICKETS_CONFIG.map(({ key, label, detail, color, icon: Icon }) => (
                  <div key={key} className="ticket-card">
                    <div className="ticket-info">
                     <div className="ticket-icon" style={{ backgroundColor: color }}>
                        <Icon size={20} color="#ffffff"  />
                      </div>

                      <div className="ticket-text">
                        <h4>{label}</h4>
                        <span className="ticket-detail">{detail}</span>
                      </div>
                    </div>

                    <div className="ticket-controls">
                      <span className="ticket-price" style={{ color }}>
                        $_
                      </span>

                      {/*contador de cantidad*/}
                      <div className="counter-box">
                        <button
                          type="button"
                          className="counter-btn counter-btn-minus"
                          aria-label="Reducir cantidad"
                          onClick={() => updateQuantity(key, -1)}
                          disabled={quantities[key] === 0}
                        >
                          -
                        </button>
                        <span>{quantities[key]}</span>
                        <button
                          type="button"
                          className="counter-btn counter-btn-plus"
                          aria-label="Aumentar cantidad"
                          onClick={() => updateQuantity(key, 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="note-text">
              Las experiencias están incluidas con cualquier entrada general.
            </p>
          </section>

          <aside className="summary-card">
            <h3>Resumen</h3>

            <div className="summary-items">
              <div className="summary-row">
                <span>_</span>
                <strong>$_</strong>
              </div>

              <div className="summary-row">
                <span>_</span>
                <strong>$_</strong>
              </div>
            </div>

            <hr className="summary-divider" />

            <div className="summary-row subtotal">
              <span>Subtotal</span>
              <strong>$_</strong>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span className="total-amount">$_</span>
            </div>

            <div className="visit-badge">
              <small>Fecha de visita</small>
              <strong>_</strong>
              <span>_</span>
            </div>

            <button type="button" className="btn-primary">
              Continuar al cobro
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default NewSale;