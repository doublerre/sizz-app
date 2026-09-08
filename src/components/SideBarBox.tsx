import { NavLink } from 'react-router-dom';
import logo from '../assets/logo_zigzag.png';
import './SideBarBox.css';

interface SidebarProps{
  userName: string;
  userRole: string;
}

//Bloque de  componentes de la barra lateral
const MENU = [
  {
    section: 'TAQUILLA',
    links: [
      { to: '/taquilla', label: 'Inicio', color: '#2563eb' },
      { to: '/taquilla/nueva-venta', label: 'Nueva venta', color: '#16a34a' },
      { to: '/taquilla/historial', label: 'Historial', color: '#eab308' },
      { to: '/taquilla/corte-caja', label: 'Corte de caja', color: '#dc2626' },
    ],
  },
  {
    section: 'ADMINISTRACIÓN',
    links: [
      { to: '/configuracion', label: 'Configuración', color: '#2563eb' },
    ],
  },
];


//Bloque para iniciales del usuario en la parte de abajo
export const Sidebar = ({ userName, userRole }: SidebarProps) => {
  // Iniciales del nombre
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <div className="sidebar-logo">
          <img src={logo} alt="ZigZag Logo" />
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
  );
};