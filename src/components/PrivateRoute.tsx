import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, type AuthUser } from "../context/useAuth";

interface PrivateRouteProps {
  requiredRole?: AuthUser["role"];
  requiredRoles?: AuthUser["role"][];
  allowedRoles?: AuthUser["role"][];
}

export default function PrivateRoute({
  requiredRole,
  requiredRoles,
  allowedRoles,
}: PrivateRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

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

  const roleLists = [requiredRoles, allowedRoles].filter(
    (roles): roles is AuthUser["role"][] => roles !== undefined,
  );
  if (
    (requiredRole && user?.role !== requiredRole) ||
    (roleLists.length > 0 &&
      (!user || roleLists.some((roles) => !roles.includes(user.role))))
  ) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
