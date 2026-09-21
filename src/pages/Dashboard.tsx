import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Banknote, CreditCard, DollarSign, Users } from 'lucide-react';
import { Sidebar } from '../components/SideBarBox';
import { TICKET_TYPES } from '../data/ticketTypes';
import './Dashboard.css';

interface StatItem {
  value: string;
  detail: string;
}

interface TicketItem {
  price: string;
  detail: string;
}

interface ShiftData {
  status: string;
  caja: string;
  cajero: string;
  fondoInicial: string;
}

interface DashboardProps {
  stats?: Record<string, StatItem>;
  tickets?: Record<string, TicketItem>;
  shiftData?: ShiftData;
}

const STATS_CONFIG = [
  { key: 'ventasTurno', label: 'Ventas del turno', color: 'var(--color-primary)', icon: DollarSign },
  { key: 'efectivoCaja', label: 'Efectivo en caja', color: 'var(--color-success)', icon: Banknote },
  { key: 'pagosTarjeta', label: 'Pagos con tarjeta', color: 'var(--color-warning)', icon: CreditCard },
  { key: 'visitantesHoy', label: 'Visitantes hoy', color: 'var(--color-danger)', icon: Users },
];

const MOCK_STATS: Record<string, StatItem> = {
  ventasTurno: { value: '_', detail: '_' + 'boletos emitidos' },
  efectivoCaja: { value: '_', detail: 'Fondo inicial incluido' },
  pagosTarjeta: { value: '_', detail: '_' + 'operaciones' },
  visitantesHoy: { value: '_', detail: 'Aforo actual:' + '_' },
};

const MOCK_TICKETS: Record<string, TicketItem> = {
  adulto: { price: '_', detail: 'Incluye todas las experiencias' },
  infantil: { price: '_', detail: 'Incluye todas las experiencias' },
  adultoMayor: { price: '_', detail: 'Incluye todas las experiencias' },
  festival: { price: '_', detail: 'Incluye todas las experiencias' },
};

const MOCK_SHIFT: ShiftData = {
  status: '_',
  caja: '_',
  cajero: '_',
  fondoInicial: '_',
};

export const Dashboard: React.FC<DashboardProps> = ({
  stats = MOCK_STATS,
  tickets = MOCK_TICKETS,
  shiftData = MOCK_SHIFT,
}) => {
  const navigate = useNavigate();

  return (
    <div className="d-wrapper">
      <Sidebar userName="_" userRole="_" />
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

        <section className="d-stats">
          {STATS_CONFIG.map(({ key, label, color, icon: Icon }) => (
            <div className="d-stat-card" key={key}>
              <div className="d-stat-icon" style={{ backgroundColor: color }}>
                <Icon size={20} color="#ffffff" />
              </div>
              <div className="d-stat-info">
                <span className="d-stat-label">{label}</span>
                <span className="d-stat-value">{stats[key]?.value ?? '-'}</span>
                <span className="d-stat-detail">{stats[key]?.detail ?? '-'}</span>
              </div>
            </div>
          ))}
        </section>

        <section className="d-content">
          <section className="d-quick-sale">
            <h2 className="d-quick-sale-title">Venta Rápida</h2>
            <p className="d-subtitle">Selecciona el tipo de boleto para continuar</p>
            <div className="d-ticket-grid">
              {TICKET_TYPES.map(({ key, label, color, icon: Icon }) => (
                <button className="d-ticket-card" key={key} type="button">
                  <div className="d-ticket-icon" style={{ background: color }}>
                    <Icon size={18} color="#ffffff" />
                  </div>
                  <div className="d-ticket-info">
                    <span className="d-ticket-label">{label}</span>
                    <span className="d-ticket-price" style={{ color }}>
                      {tickets[key]?.price ?? '-'}
                    </span>
                    <span className="d-ticket-detail">{tickets[key]?.detail ?? '-'}</span>
                  </div>
                </button>
              ))}
            </div>
            <button className="d-btn-newsale" type="button" onClick={() => navigate('/taquilla/newSale')}>
              Iniciar nueva venta
            </button>
          </section>

          <aside className="d-shift-panel">
            <h2>Turno activo</h2>
            <span className="d-shift-badge">{shiftData.status}</span>

            <div className="d-shift-group">
              <div className="d-shift-field">
                <span className="d-shift-label">Caja</span>
                <span className="d-shift-value">{shiftData.caja}</span>
              </div>
              <div className="d-shift-field">
                <span className="d-shift-label">Cajera</span>
                <span className="d-shift-value">{shiftData.cajero}</span>
              </div>
              <div className="d-shift-field">
                <span className="d-shift-label">Fondo inicial</span>
                <span className="d-shift-value d-fund">{shiftData.fondoInicial}</span>
              </div>
            </div>

            <button className="d-btn-secondary" type="button">
              Ir al corte
            </button>
          </aside>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;