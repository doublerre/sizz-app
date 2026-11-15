import { NavLink, useLocation } from 'react-router-dom';
import logo from '@/assets/logo_zigzag_main.png';
import './SideBarBox.css';
import { useEffect, useState } from 'react';
import {
  isBoxOfficeShiftOpen,
  subscribeToBoxOfficeShiftFlag,
} from '@/utils/boxOfficeShiftFlag';
import { ticketbootService } from '@/services/ticketboot.service';

interface SidebarProps {
  userName: string;
  userRole: string;
}

//Bloque de  componentes de la barra lateral
const MENU = [
  {
    section: 'TAQUILLA',
    links: [
      { to: '/taquilla/inicio-turno', label: 'Inicio de turno', color: '#0868B7' },
      { to: '/taquilla/dashboard', label: 'Inicio', color: '#0868B7' },
      { to: '/taquilla/newSale', label: 'Nueva venta', color: '#55B82C' },
      { to: '/taquilla/corte', label: 'Corte de caja', color: '#EF4050' },
      { to: '/taquilla/historial', label: 'Historial', color: '#FBC400' },
      { to: '/cuenta/reservaciones', label: 'Reservaciones', color: '#FBC400' },
    ],
  },
  {
    section: 'ADMINISTRACIÓN',
    links: [
      { to: '/configuracion', label: 'Configuración', color: '#0868B7' },
    ],
  },
];


//Bloque para iniciales del usuario en la parte de abajo
export const Sidebar = ({ userName, userRole }: SidebarProps) => {
  const { pathname } = useLocation();
  const isBoxOfficeRoute = pathname.startsWith('/taquilla');
  const[isOpen, setIsOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState<boolean | null>(
    null,
  );
  const [cachedShiftOpen, setCachedShiftOpen] = useState(isBoxOfficeShiftOpen);
  const [shiftStatusError, setShiftStatusError] = useState(false);
  const toggleSidebar=()=>{
    setIsOpen(!isOpen);
  }

  useEffect(() => {
    let isActive = true;
    let requestId = 0;
    const refreshShiftStatus = async () => {
      const currentRequestId = ++requestId;
      setIsShiftOpen(null);
      setShiftStatusError(false);

      try {
        const dashboard = await ticketbootService.getDashboard();
        if (isActive && currentRequestId === requestId) {
          setIsShiftOpen(Boolean(dashboard.activeShift));
        }
      } catch {
        if (isActive && currentRequestId === requestId) {
          setShiftStatusError(true);
        }
      }
    };

    const unsubscribe = subscribeToBoxOfficeShiftFlag(() => {
      setCachedShiftOpen(isBoxOfficeShiftOpen());
      if (isBoxOfficeRoute) void refreshShiftStatus();
    });
    if (isBoxOfficeRoute) void refreshShiftStatus();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [isBoxOfficeRoute]);

  const canShowStartShift = isBoxOfficeRoute
    ? isShiftOpen === false
    : cachedShiftOpen !== true;
  const canAccessCashClosing = isBoxOfficeRoute
    ? isShiftOpen === true
    : cachedShiftOpen;

  // Iniciales del nombre
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
    {!isOpen && (
      <button
        className="sidebar-toggle-btn"
        onClick={toggleSidebar}
        aria-label="Abrir menú"
        type="button"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    )}

      {/* Fondo oscuro para cerrar al presionar afuera */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar} />
      )}

    <aside className={`sidebar ${isOpen ? 'is-open' : ''}`}>
      <div className="sidebar-top">
        <div className="sidebar-header-mobile">
        <div className="sidebar-logo">
          <img src={logo} alt="ZigZag Logo" />
        </div>

        <button
              className="sidebar-close-btn"
              onClick={toggleSidebar}
              type="button">
            </button>
          </div>

        <nav className="sidebar-nav">
          {shiftStatusError && (
            <p className="sidebar-shift-error" role="alert">
              No se pudo verificar el turno activo. Actualiza la página para volver a intentar.
            </p>
          )}
          {MENU.map(({ section, links }) => (
            <div key={section}>
              <p className="sidebar-section-title">{section}</p>
              <ul>
                {links
                  .filter(({ to }) =>
                    (to !== '/taquilla/inicio-turno' || canShowStartShift)
                    && (to !== '/taquilla/corte' || canAccessCashClosing))
                  .map(({ to, label, color }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end
                        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                      >
                        <span className="sidebar-dot" style={{ backgroundColor: color }} />
                        <span>{label}</span>
                      </NavLink>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-user-name">{userName}</span>
          <span className="sidebar-user-role">{userRole}</span>
        </div>
      </div>

      <button
        type="button"
        className="sidebar-close-menu"
        onClick={toggleSidebar}
      >
        Cerrar menú
      </button>
    </aside>
    </>
  );
};