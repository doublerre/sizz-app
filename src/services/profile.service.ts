import api from "./api";

export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    institution?: string;
    role: string;
    isActive: boolean;
}

export const profileService = {
    /** Consulta el perfil del usuario autenticado: GET /users/me */
    async getMyProfile(): Promise<UserProfile> {
        const res = await api.get<UserProfile>("/users/me");
        return res.data;
    },

    /** Actualiza el perfil del usuario: PUT /users/me */
    async updateMyProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
        const res = await api.put<UserProfile>("/users/me", profile);
        return res.data;
    },
};
