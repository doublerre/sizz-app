import api from './api';

export interface ForgotPasswordPayload {
    email: string;
}

export interface ResetPasswordPayload {
    email: string;
    code: string;
    newPassword: string;
}

export const passwordResetService = {
    async forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
        await api.post('/auth/forgot-password', payload);
    },
    async resetPassword(payload: ResetPasswordPayload): Promise<void> {
        await api.post('/auth/reset-password', payload);
    }
}