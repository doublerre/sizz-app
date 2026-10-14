import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
    requiredRole?: "ADMIN" | "USER" | "GUIDE";
}

export default function PrivateRoute({ requiredRole }: PrivateRouteProps) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
