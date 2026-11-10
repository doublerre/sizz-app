import { Routes, Route } from "react-router-dom";
import HomePage from "@/pages/public/HomePage";
import ExperiencesPage from "@/pages/public/ExperiencesPage";
import EventsPage from "@/pages/public/EventsPage";
import LoginPage from "@/pages/public/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage.tsx";
import AppLayout from "@/layouts/AppLayout.tsx";
import PublicLayout from "@/layouts/PublicLayout.tsx";
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
import ExperiencesAdministrationPage from "@/pages/app/ExperiencesAdministrationPage";
import NewExperience from "@/forms/experiences/NewExperience";
import EditExperience from "@/forms/experiences/EditExperience";
import AdminDashboard from "@/pages/app/AdminDashboard";
import UserAdminPage from "@/pages/app/UserAdminPage";
import UserForm from "@/forms/users/UserForm";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/auth/ResetPasswordPage";

export default function AppRouter() {
    return (
        <Routes>
            {/* Públicas */}
            <Route path="/" element={<HomePage />} />
            <Route path="/experiencias" element={<ExperiencesPage />} />
            <Route element={<PublicLayout />}>
                <Route path="/eventos" element={<EventsPage />} />
            </Route>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
            <Route path="/recuperar-contrasena/restablecer" element={<ResetPasswordPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register/verify-account" element={<Verify />} />

            {/* Solo ADMIN */}
            <Route element={<PrivateRoute requiredRole="ADMIN" />}>
                <Route path="/app" element={<AppLayout />}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="experiences" element={<ExperiencesAdministrationPage />} />
                    <Route path="experiences/new" element={<NewExperience />} />
                    <Route path="experiences/:id/edit" element={<EditExperience />} />
                    <Route path="reservaciones" element={<ReservationsPage />} />
                    <Route path="eventos" element={<EventsAdminPage />} />
                    <Route path="users" element={<UserAdminPage />} />
                    <Route path="users/new" element={<UserForm mode="create" />} />
                    <Route path="users/:id/edit" element={<UserForm mode="edit" />} />
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