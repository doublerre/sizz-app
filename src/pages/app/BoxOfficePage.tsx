import { Outlet } from "react-router-dom";

export default function BoxOfficePage() {
  // <Outlet /> renderiza la sub-ruta activa (/taquilla/dashboard, /taquilla/newsale, etc.)
  return <Outlet />;
}