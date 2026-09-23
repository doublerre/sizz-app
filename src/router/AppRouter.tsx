import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/public/HomePage";
import EventsPage from "@/pages/public/EventsPage";
import LoginPage from "@/pages/public/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage.tsx";
import AppLayout from "@/layouts/AppLayout.tsx";
import AccountLayout from "@/layouts/AccountLayout.tsx";
import BoxOfficePage from "@/pages/app/BoxOfficePage.tsx";
import ReservationsPage from "@/pages/app/ReservationsPage.tsx";
import EventsAdminPage from "@/pages/app/EventsAdminPage.tsx";
import MyReservationsPage from "@/pages/account/MyReservationsPage.tsx";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />}>
                <Route path="verify-account" element={<Verify />} />
            </Route>
            <Route path="/app" element={<AppLayout />}>
                <Route path="reservaciones" element={<ReservationsPage />} />
                <Route path="eventos" element={<EventsAdminPage />} />
            </Route>
            {/* Temporal: sin AppLayout porque BoxOfficePage trae su propio menú.
             Pendiente: sacar SideBarBox a un BoxOfficeLayout y anidar aquí. */}
            <Route path="/taquilla" element={<BoxOfficePage />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="newsale" element={<Newsale />} />
                <Route path="historial" element={<SalesHistory />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="saleComplete" element={<SaleComplete />} />
            </Route>
            <Route path="/cuenta" element={<AccountLayout />}>
                <Route path="reservaciones" element={<MyReservationsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}