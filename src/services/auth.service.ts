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
    code: string;
    role?: "USER" | "GUIDE";
}

export const authService = {
    sendVerificationCode: (email: string): Promise<void> =>
        api.post("/auth/send-verification-code", { email }),

    register: (payload: RegisterPayload): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/register", payload).then((r) => r.data),

    login: (email: string, password: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),

    refresh: (refreshToken: string): Promise<TokenResponse> =>
        api.post<TokenResponse>("/auth/refresh", { refreshToken }).then((r) => r.data),
};
