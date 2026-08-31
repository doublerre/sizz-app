import { Routes, Route } from "react-router-dom";
import HomePage from "../pages/public/HomePage";
import EventsPage from "../pages/public/EventsPage";
import LoginPage from "../pages/public/LoginPage";
import NotFoundPage from "../pages/NotFoundPage.tsx";

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />}></Route>
            <Route path="/eventos" element={<EventsPage />}></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="*" element={<NotFoundPage />}></Route>
        </Routes>
    )
}