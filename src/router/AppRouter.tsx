import { Route, Routes } from 'react-router-dom';
import NotFoundPage from '../pages/NotFoundPage';
import EventsPage from '../pages/public/EventsPage';
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';


export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}