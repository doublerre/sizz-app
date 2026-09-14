import { NavLink } from 'react-router-dom';
import logo from '../assets/logo_zigzagA.png';
import './SideBarBox.css';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface SidebarProps{
  userName: string;
  userRole: string;
}

//Bloque de  componentes de la barra lateral
const MENU = [
  {
    section: 'TAQUILLA',
    links: [
      { to: '/taquilla', label: 'Inicio', color: '#0868B7' },
      { to: '/taquilla/nueva-venta', label: 'Nueva venta', color: '#55B82C' },
      { to: '/taquilla/historial', label: 'Historial', color: '#FBC400' },
      { to: '/taquilla/corte-caja', label: 'Corte de caja', color: '#EF4050' },
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
  const[isOpen, setIsOpen] = useState(false);
  const toggleSidebar=()=>{
    setIsOpen(!isOpen);
  }

  // Iniciales del nombre
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
    {/* Botón hamburguesa visible solo en móviles */}
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
          {MENU.map(({ section, links }) => (
            <div key={section}>
              <p className="sidebar-section-title">{section}</p>
              <ul>
                {links.map(({ to, label, color }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={to === '/taquilla'}
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
    </aside>
    </>
  );
};