import api from './api';

export interface AdminUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export const adminUsersService = {
    /** El backend devuelve un Page<UserResponse> con campo `content`. */
    async listUsers(): Promise<AdminUser[]> {
        const res = await api.get<any>('/admin/users');
        return Array.isArray(res.data) ? res.data : (res.data?.content || []);
    },

    /** Cambia el rol de un usuario: PUT /admin/users/{id}/role */
    async updateRole(userId: string, role: string): Promise<AdminUser> {
        const res = await api.put<AdminUser>(`/admin/users/${userId}/role`, { role });
        return res.data;
    },

    /** Consulta un usuario individual: GET /users/{id} */
    async getUserById(userId: string): Promise<AdminUser> {
        const res = await api.get<AdminUser>(`/users/${userId}`);
        return res.data;
    },
};
