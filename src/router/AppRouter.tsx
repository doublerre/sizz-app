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
import CashClosing from "@/pages/CashClosing";
import PrivateRoute from "@/components/PrivateRoute";
import {
  GuideLayout,
  ScholarshipPublicLayout,
} from "@/components/scholarships/ScholarshipUI";
import CallsPage from "@/pages/scholarships/CallsPage";
import CallDetailsPage from "@/pages/scholarships/CallDetailsPage";
import ApplicationPage from "@/pages/scholarships/ApplicationPage";
import ApplicationStatusPage, {
  MyApplicationsPage,
} from "@/pages/scholarships/ApplicationStatusPage";
import ExamsPage from "@/pages/scholarships/ExamsPage";
import MyHoursPage from "@/pages/scholarships/MyHoursPage";
import ScholarshipAdminLayout from "@/pages/app/scholarships/ScholarshipAdminLayout";
import CallsAdminPage from "@/pages/app/scholarships/CallsAdminPage";
import CallEditorPage from "@/pages/app/scholarships/CallEditorPage";
import FormsAdminPage from "@/pages/app/scholarships/FormsAdminPage";
import CatalogsPage from "@/pages/app/scholarships/CatalogsPage";
import ApplicationsAdminPage from "@/pages/app/scholarships/ApplicationsAdminPage";
import EvaluationAdminPage from "@/pages/app/scholarships/EvaluationAdminPage";
import HoursAdminPage from "@/pages/app/scholarships/HoursAdminPage";

export default function AppRouter() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/" element={<HomePage />} />
      <Route path="/eventos" element={<EventsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/register/verify-account" element={<Verify />} />
      <Route path="verify-account" element={<Verify />} />
      <Route element={<ScholarshipPublicLayout />}>
        <Route path="/becas" element={<CallsPage />} />
        <Route element={<PrivateRoute />}>
          <Route path="/becas/:callId" element={<CallDetailsPage />} />
          <Route path="/cuenta/becas" element={<MyApplicationsPage />} />
          <Route
            path="/cuenta/becas/:applicationId"
            element={<ApplicationStatusPage />}
          />
          <Route
            path="/cuenta/becas/:applicationId/editar"
            element={<ApplicationPage />}
          />
          <Route
            path="/cuenta/becas/:applicationId/examenes"
            element={<ExamsPage />}
          />
        </Route>
      </Route>
      <Route element={<PrivateRoute />}>
        <Route element={<GuideLayout />}>
          <Route path="/cuenta/becas/horas" element={<MyHoursPage />} />
        </Route>
      </Route>

      {/* Administración de becas: permisos según la API */}
      <Route
        element={
          <PrivateRoute allowedRoles={["ADMIN", "SCHOLARSHIP_MANAGER"]} />
        }
      >
        <Route path="/app" element={<AppLayout />}>
          <Route path="becas" element={<ScholarshipAdminLayout />}>
            <Route index element={<CallsAdminPage />} />
            <Route path="nueva" element={<CallEditorPage />} />
            <Route path="catalogos" element={<CatalogsPage />} />
            <Route path="formularios" element={<FormsAdminPage />} />
            <Route path="formularios/:formId" element={<FormsAdminPage />} />
            <Route path=":callId/editar" element={<CallEditorPage />} />
            <Route
              path=":callId/postulaciones"
              element={<ApplicationsAdminPage />}
            />
            <Route element={<PrivateRoute requiredRole="ADMIN" />}>
              <Route
                path=":callId/evaluacion"
                element={<EvaluationAdminPage />}
              />
              <Route path=":callId/horas" element={<HoursAdminPage />} />
            </Route>
          </Route>
          <Route element={<PrivateRoute requiredRole="ADMIN" />}>
            <Route path="reservaciones" element={<ReservationsPage />} />
            <Route path="eventos" element={<EventsAdminPage />} />
          </Route>
        </Route>
      </Route>
      <Route element={<PrivateRoute requiredRole="ADMIN" />}>
        <Route path="/taquilla" element={<BoxOfficePage />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="newsale" element={<NewSale />} />
          <Route path="historial" element={<SalesHistory />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="corte" element={<CashClosing />} />
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
