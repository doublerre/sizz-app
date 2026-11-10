import { createContext, useContext } from "react";
import type { TokenResponse } from "../services/auth.service";

export interface AuthUser {
  sub: string;
  uid: string;
  role: "USER" | "ADMIN" | "GUIDE" | "CASHIER" | "SCHOLARSHIP_MANAGER";
  exp: number;
}
export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  loginWithTokens: (tokens: TokenResponse) => AuthUser;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextValue | null>(null);
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return context;
}
