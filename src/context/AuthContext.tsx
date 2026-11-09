import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  authService,
  type RegisterPayload,
  type TokenResponse,
} from "../services/auth.service";
import { AuthContext, type AuthUser } from "./useAuth";

interface JwtClaims {
    sub: string;  // email
    uid: string;
    role: "USER" | "ADMIN" | "GUIDE" | "CASHIER";
    exp: number;
}

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

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = localStorage.getItem("sizz_access_token");
    const refreshToken = localStorage.getItem("sizz_refresh_token");
    if (!token && refreshToken) return true;
    if (token && refreshToken) {
      try {
        const claims = decodeJwt(token);
        if (claims.exp * 1000 < Date.now()) {
          return true;
        }
      } catch {
        return true;
      }
    }
    return false;
  });

  useEffect(() => {
    const token = localStorage.getItem("sizz_access_token");
    const refreshToken = localStorage.getItem("sizz_refresh_token");

    let shouldRefresh = false;
    if (!token && refreshToken) {
      shouldRefresh = true;
    } else if (token && refreshToken) {
      try {
        const claims = decodeJwt(token);
        if (claims.exp * 1000 < Date.now()) {
          shouldRefresh = true;
        }
      } catch {
        shouldRefresh = true;
      }
    }

    if (shouldRefresh && refreshToken) {
      authService.refresh(refreshToken)
        .then((tokens) => {
          const currentRefreshToken = localStorage.getItem("sizz_refresh_token");
          if (currentRefreshToken !== refreshToken) {
            return;
          }
          const claims = persistTokens(tokens);
          setUser(claims);
        })
        .catch(() => {
          const currentRefreshToken = localStorage.getItem("sizz_refresh_token");
          if (currentRefreshToken !== refreshToken) {
            return;
          }
          localStorage.removeItem("sizz_access_token");
          localStorage.removeItem("sizz_refresh_token");
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login(email, password);
    const claims = persistTokens(tokens);
    setUser(claims);
    return claims;
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const tokens = await authService.register(payload);
    const claims = persistTokens(tokens);
    setUser(claims);
    return claims;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sizz_access_token");
    localStorage.removeItem("sizz_refresh_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
