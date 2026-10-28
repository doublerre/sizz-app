import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PrivateRouteProps {
    requiredRole?: "ADMIN" | "USER" | "GUIDE";
    requiredRoles?: ("ADMIN" | "USER" | "GUIDE" | "CASHIER")[];
}

export default function PrivateRoute({ requiredRole, requiredRoles }: PrivateRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if ((requiredRole && user?.role !== requiredRole) || (requiredRoles && !requiredRoles.includes(user?.role ?? "USER"))) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
