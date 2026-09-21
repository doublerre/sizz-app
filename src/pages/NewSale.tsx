import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/SideBarBox';
import { TICKET_TYPES } from '../data/ticketTypes';
import './NewSale.css';

export const NewSale = () => {
  const navigate = useNavigate();
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
                {TICKET_TYPES.map(({ key, label, detail, color, icon: Icon }) => (
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

            <button type="button" className="btn-primary" onClick={() => navigate('/taquilla/checkout')}>
              Continuar al cobro
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default NewSale;