import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { authService, type RegisterPayload, type TokenResponse } from "../services/auth.service";

interface JwtClaims {
    sub: string;  // email
    uid: string;
    role: "USER" | "ADMIN" | "GUIDE";
    exp: number;
}

interface AuthUser extends JwtClaims {}

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
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

    const login = useCallback(async (email: string, password: string) => {
        const tokens = await authService.login(email, password);
        setUser(persistTokens(tokens));
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
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}
