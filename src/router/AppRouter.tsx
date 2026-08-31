import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import EventsPage from "../pages/public/EventsPage";
import LoginPage from "../pages/public/LoginPage";
import NotFoundPage from "../pages/NotFoundPage.tsx";
import AppLayout from "../layouts/AppLayout.tsx";
import AccountLayout from "../layouts/AccountLayout.tsx";
import BoxOfficePage from "../pages/app/BoxOfficePage.tsx";
import ReservationsPage from "../pages/app/ReservationsPage.tsx";
import EventsAdminPage from "../pages/app/EventsAdminPage.tsx";
import MyReservationsPage from "../pages/account/MyReservationsPage.tsx";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/app" element={<AppLayout />}>
                <Route path="taquilla" element={<BoxOfficePage />} />
                <Route path="reservaciones" element={<ReservationsPage />} />
                <Route path="eventos" element={<EventsAdminPage />} />
            </Route>
            <Route path="/cuenta" element={<AccountLayout />}>
                <Route path="reservaciones" element={<MyReservationsPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    )
}