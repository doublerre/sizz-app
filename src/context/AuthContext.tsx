import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authService, type RegisterPayload, type TokenResponse } from "../services/auth.service";

interface JwtClaims {
    sub: string;  // email
    uid: string;
    role: "USER" | "ADMIN" | "GUIDE";
    exp: number;
}

type AuthUser = JwtClaims;

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<JwtClaims>;
    register: (payload: RegisterPayload) => Promise<JwtClaims>;
    logout: () => void;
}

function decodeJwt(token: string): JwtClaims {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
}

function persistTokens(tokens: TokenResponse): JwtClaims {
    localStorage.setItem("sizz_access_token", tokens.accessToken);
    localStorage.setItem("sizz_refresh_token", tokens.refreshToken);
    return decodeJwt(tokens.accessToken);
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

const AuthContext = createContext<AuthContextValue | null>(null);

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
                    const claims = persistTokens(tokens);
                    setUser(claims);
                })
                .catch(() => {
                    localStorage.removeItem("sizz_access_token");
                    localStorage.removeItem("sizz_refresh_token");
                    setUser(null);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, []);

    const login = useCallback(async (email: string, password: string): Promise<JwtClaims> => {
        const tokens = await authService.login(email, password);
        const claims = persistTokens(tokens);
        setUser(claims);
        return claims;
    }, []);

    const register = useCallback(async (payload: RegisterPayload): Promise<JwtClaims> => {
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}
