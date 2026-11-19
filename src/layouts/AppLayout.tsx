import { Outlet } from "react-router-dom";
import AppSidebar from "@/components/AppSidebar";
import "./AppLayout.css";

// El menú es el mismo de taquilla: lo arma AppSidebar según el rol
export default function AppLayout() {
  return (
    <div className="admin-layout">
      <AppSidebar />
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}