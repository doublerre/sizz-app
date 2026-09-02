import { Outlet, NavLink } from "react-router-dom";
import "./AppLayout.css";
import logo from "../assets/logo_zigzag_main.svg"

const mainMenu = [
    { label: "Inicio", to: "", available: false, color: "var(--brand-blue)" },
    { label: "Experiencias", to: "", available: false, color: "var(--brand-green)" },
    { label: "Visitantes", to: "", available: false, color: "var(--brand-yellow)" },
    { label: "Reservaciones", to: "/app/reservaciones", available: true, color: "var(--brand-red)" },
    { label: "Contenidos", to: "", available: false, color: "var(--brand-blue)" },
    { label: "Reportes", to: "", available: false, color: "var(--brand-green)" }
]

const adminMenu = [
    { label: "Boletos", to: "", available: false, color: "var(--brand-blue)" },
    { label: "Becas y Guias", to: "", available: false, color: "var(--brand-green)" },
    { label: "Usuarios", to: "", available: false, color: "var(--brand-yellow)" },
    { label: "Configuracion", to: "", available: false, color: "var(--brand-red)" }
]

function AppLayout() {
    return (
        <div className="layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="ZigZag" />
                </div>
                <h2 className="sidebar-group">MENÚ PRINCIPAL</h2>
                {mainMenu.map((item) =>
                    item.available ? <NavLink className="sidebar-item" key={item.label} to={item.to}>
                        <span className="sidebar-dot" style={{ backgroundColor: item.color }}></span>
                        {item.label}
                    </NavLink> : <span className="sidebar-item sidebar-item-disabled" key={item.label}><span className="sidebar-dot" style={{ backgroundColor: item.color }} />{item.label}</span>)
                }

                <h2 className="sidebar-group">ADMINISTRACIÓN</h2>
                {adminMenu.map((item) =>
                    item.available ? <NavLink className="sidebar-item" key={item.label} to={item.to}>
                        <span className="sidebar-dot" style={{ backgroundColor: item.color }}></span>
                        {item.label}
                    </NavLink> : <span className="sidebar-item sidebar-item-disabled" key={item.label}><span className="sidebar-dot" style={{ backgroundColor: item.color }} />{item.label}</span>

                )}
                <div className="sidebar-user">
                    <div className="sidebar-avatar">JB</div>
                    <div>
                        <div>Jesus Bernal</div>
                        <div>Administrador</div>
                    </div>
                </div>

            </nav>

            <main className="content">
                <Outlet />
            </main>
        </div>
    )
}
export default AppLayout
