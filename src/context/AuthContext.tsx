import { useState, useCallback, type ReactNode } from "react";
import {
  authService,
  type RegisterPayload,
  type TokenResponse,
} from "../services/auth.service";
import { AuthContext, type AuthUser } from "./useAuth";

function decodeJwt(token: string): AuthUser {
  const payload = token.split(".")[1];
  return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

function persistTokens(tokens: TokenResponse): AuthUser {
  const claims = decodeJwt(tokens.accessToken);
  localStorage.setItem("sizz_access_token", tokens.accessToken);
  localStorage.setItem("sizz_refresh_token", tokens.refreshToken);
  return claims;
}

function loadUserFromStorage(): AuthUser | null {
  const token = localStorage.getItem("sizz_access_token");
  if (!token) return null;
  try {
    const claims = decodeJwt(token);
    if (claims.exp * 1000 < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUserFromStorage);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login(email, password);
    const claims = persistTokens(tokens);
    setUser(claims);
    return claims;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const tokens = await authService.register(payload);
    setUser(persistTokens(tokens));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sizz_access_token");
    localStorage.removeItem("sizz_refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
