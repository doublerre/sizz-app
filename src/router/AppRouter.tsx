import { Route, Routes } from 'react-router-dom';
import Checkout from '../pages/Checkout';
import Dashboard from '../pages/Dashboard';
import NewSale from '../pages/NewSale';
import NotFoundPage from '../pages/NotFoundPage';
import SaleComplete from '../pages/SaleComplete';
import EventsPage from '../pages/public/EventsPage';
import HomePage from '../pages/public/HomePage';
import LoginPage from '../pages/public/LoginPage';

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/eventos" element={<EventsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/taquilla/newSale" element={<NewSale />} />
            <Route path="/taquilla/checkout" element={<Checkout />} />
            <Route path="/taquilla/saleComplete" element={<SaleComplete />} />
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}