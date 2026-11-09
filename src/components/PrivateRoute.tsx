import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type AuthUser } from "../context/useAuth";

interface PrivateRouteProps {
    requiredRole?: "ADMIN" | "USER" | "GUIDE";
}

export default function PrivateRoute({ requiredRole }: PrivateRouteProps) {
    const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    );
  }

    if (requiredRole && user?.role !== requiredRole) {
        return <Navigate to="/" replace />;
    }

  return <Outlet />;
}
