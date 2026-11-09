import { createContext, useContext } from "react";
import type { RegisterPayload } from "../services/auth.service";

export interface AuthUser {
  sub: string;
  uid: string;
  role: "USER" | "ADMIN" | "GUIDE" | "CASHIER" | "SCHOLARSHIP_MANAGER";
  exp: number;
}
interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (payload: RegisterPayload) => Promise<AuthUser>;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}
