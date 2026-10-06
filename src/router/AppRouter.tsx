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
import Register from "@/pages/auth/Register.tsx";
import Verify from "@/pages/auth/Verify.tsx";
import Dashboard from "@/pages/Dashboard";
import SalesHistory from "@/pages/SalesHistory";
import Checkout from "@/pages/Checkout";
import NewSale from "@/pages/NewSale";
import SaleComplete from "@/pages/SaleComplete";
import ReservationFee from "@/pages/ReservationFee";
import PrivateRoute from "@/components/PrivateRoute";

export default function AppRouter() {
    return (
        <Routes>
            {/* Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/verify-account" element={<Verify />} />

            {/* Solo ADMIN */}
            <Route element={<PrivateRoute requiredRole="ADMIN" />}>
                <Route path="/app" element={<AppLayout />}>
                    <Route path="reservaciones" element={<ReservationsPage />} />
                    <Route path="eventos" element={<EventsAdminPage />} />
                </Route>
                <Route path="/taquilla" element={<BoxOfficePage />}>
                    <Route index element={<Dashboard />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="newsale" element={<NewSale />} />
                    <Route path="historial" element={<SalesHistory />} />
                    <Route path="checkout" element={<Checkout />} />
                    <Route path="reservationFee" element={<ReservationFee />} />
                    <Route path="saleComplete" element={<SaleComplete />} />
                </Route>
            </Route>

            {/* Autenticados (cualquier rol) */}
            <Route element={<PrivateRoute />}>
                <Route path="/cuenta" element={<AccountLayout />}>
                    <Route path="reservaciones" element={<MyReservationsPage />} />
                </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}