import { Outlet, NavLink } from "react-router-dom";
import "./AppLayout.css";
import logo from "../assets/logo_zigzag_main.svg"

const mainMenu = [
    { label: "Inicio", to: "", available: false },
    { label: "Experiencias", to: "", available: false },
    { label: "Visitantes", to: "", available: false },
    { label: "Reservaciones", to: "/app/reservaciones", available: true },
    { label: "Contenidos", to: "", available: false },
    { label: "Reportes", to: "", available: false }

]

const adminMenu = [
    { label: "Boletos", to: "", available: false },
    { label: "Becas y Guias", to: "", available: false },
    { label: "Usuarios", to: "", available: false },
    { label: "Configuracion", to: "", available: false }
]

function AppLayout() {
    return (
        <div className="layout">
            <nav className="sidebar">
                <div className="sidebar-header">
                    <img src={logo} alt="" />
                </div>
                <h2 className="sidebar-group">MENÚ PRINCIPAL</h2>
                {mainMenu.map((item) =>
                    item.available ? <NavLink className="sidebar-item" key={item.label} to={item.to}>
                        {item.label}
                    </NavLink> : <span className="sidebar-item sidebar-item-disabled" key={item.label}>{item.label}</span>)}

                <h2 className="sidebar-group">ADMINISTRACIÓN</h2>
                {adminMenu.map((item) =>
                    item.available ? <NavLink className="sidebar-item" key={item.label} to={item.to}>
                        {item.label}
                    </NavLink> : <span className="sidebar-item sidebar-item-disabled" key={item.label}>{item.label}</span>

                )}
            </nav>


            <main className="content">
                <Outlet />
            </main>
        </div>
    )
}
export default AppLayout
