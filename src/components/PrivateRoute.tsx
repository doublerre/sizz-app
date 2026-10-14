import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type AuthUser } from "../context/useAuth";

interface PrivateRouteProps {
  requiredRole?: AuthUser["role"];
  allowedRoles?: AuthUser["role"][];
}

export default function PrivateRoute({
  requiredRole,
  allowedRoles,
}: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ returnTo: location.pathname + location.search }}
      />
    );
  }

  if (
    (requiredRole && user?.role !== requiredRole) ||
    (allowedRoles && (!user || !allowedRoles.includes(user.role)))
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
