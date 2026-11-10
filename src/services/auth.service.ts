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
}

export interface VerifyPayload {
    email: string;
    code: string;
}

export interface ResendCodePayload {
    email: string;
    firstName: string;
}

export const authService = {
    /** Registra un nuevo usuario (sin code, sin role). El backend envía el OTP. */
    register: (payload: RegisterPayload): Promise<void> =>
        api.post("/auth/register", payload).then(() => {}),

    /** Verifica el código OTP y activa la cuenta, devolviendo tokens de sesión. */
    verify: (payload: VerifyPayload): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/verify", payload).then((r) => r.data),

    /** Reenvía el código OTP al correo del usuario. */
    resendCode: (payload: ResendCodePayload): Promise<void> =>
        api.post("/auth/resend-code", payload).then(() => {}),

    login: (email: string, password: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),

    refresh: (refreshToken: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),
};
