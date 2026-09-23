import { Check, Download, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/SideBarBox';
import './SaleComplete.css';

interface SaleCompleteProps {
  folio?: string;
  ticketCount?: string;
  ticketType?: string;
  totalPaid?: string;
  visitDate?: string;
  status?: string;
  onPrint?: () => void;
  onSendEmail?: () => void;
  onDownloadPdf?: () => void;
  onNewSale?: () => void;
}

export const SaleComplete = ({
  folio = '_',
  ticketCount = '_',
  ticketType = '_',
  totalPaid = '_',
  visitDate = '_',
  status = '_',
  onPrint,
  onSendEmail,
  onDownloadPdf,
  onNewSale,
}: SaleCompleteProps) => {
  const navigate = useNavigate();

  return (
    <div className="layout-container">
      <Sidebar userName="_" userRole="_" />

      <main className="main-content">
        <header className="header-title">
          <h1>Venta completada</h1>
          <p>Los boletos se generaron correctamente</p>
        </header>

        <div className="complete-wrapper">
          <section className="complete-card">
            <div className="success-icon">
              <Check size={28} />
            </div>

            <h2 className="complete-title">¡Venta realizada!</h2>
            <span className="complete-folio">Folio de venta {folio}</span>

            <div className="sale-info-box">
              <div className="sale-info-text">
                <span className="sale-info-count">{ticketCount} boletos emitidos</span>
                <strong className="sale-info-amount">${totalPaid}</strong>
                <span className="sale-info-detail">{ticketType} · Visita {visitDate}</span>
              </div>
              <span className="status-badge">{status}</span>
            </div>

            <div className="complete-actions">
              <button type="button" className="btn-primary" onClick={onPrint}>
                Imprimir boletos
              </button>

              <button type="button" className="btn-link" onClick={onSendEmail}>
                <Mail size={16} />
                Enviar por correo
              </button>
              <button type="button" className="btn-link" onClick={onDownloadPdf}>
                <Download size={16} />
                Descargar PDF
              </button>
            </div>

            <p className="note-box">
              Los boletos incluyen todas las experiencias disponibles durante la visita.
            </p>

            <button
              type="button"
              className="btn-newsale"
              onClick={() => {
                onNewSale?.();
                navigate('/taquilla/newSale');
              }}
            >
              Iniciar otra venta
            </button>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SaleComplete;