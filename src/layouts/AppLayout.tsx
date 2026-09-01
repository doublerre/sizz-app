import { Outlet, NavLink } from "react-router-dom";
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
        <>
            <p>MENÚ PRINCIPAL</p>
            {mainMenu.map((item) =>
                item.available ? <NavLink key={item.label} to={item.to}>
                    {item.label}
                </NavLink> : <span key={item.label}>{item.label}</span>)}

            <p>ADMINISTRACIÓN</p>
            {adminMenu.map((item) =>
                item.available ? <NavLink key={item.label} to={item.to}>
                    {item.label}
                </NavLink> : <span key={item.label}>{item.label}</span>

            )}

            <Outlet />
        </>
    )
}
export default AppLayout
