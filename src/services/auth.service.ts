import api from "./api";

export interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
}

export interface ApiError {
    code: string;
    message: string;
    details: { field: string; message: string }[];
}

export interface RegisterPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: "USER" | "GUIDE";
}

export const authService = {
    /** Guarda el usuario inactivo en BD y envía el código al correo. No devuelve tokens. */
    register: (payload: RegisterPayload): Promise<void> =>
        api.post("/auth/register", payload).then(() => {}),

    /** Verifica el código OTP, activa la cuenta y devuelve tokens de sesión. */
    verifyAccount: (email: string, code: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/verify", { email, code }).then((r) => r.data),

    login: (email: string, password: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),

    refresh: (refreshToken: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),

    /** Reenvía el código a un usuario inactivo existente. */
    sendVerificationCode: (email: string, firstName: string): Promise<void> =>
        api.post("/auth/send-verification-code", { email, firstName }).then(() => {}),
};
