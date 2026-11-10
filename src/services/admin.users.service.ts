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

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface CreateAdminUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
    sendVerificationEmail?: boolean;
    isActiveImmediately?: boolean;
}

export interface UpdateAdminUserPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
}

export const adminUsersService = {
    async listUsers(page = 0, size = 15): Promise<PageResponse<AdminUser>> {
        const res = await api.get<PageResponse<AdminUser>>(`/admin/users?page=${page}&size=${size}`);
        return res.data;
    },
    async createUser(payload: CreateAdminUserPayload): Promise<AdminUser> {
        const res = await api.post<AdminUser>('/admin/users', payload);
        return res.data;
    },

    async updateRole(userId: string, role: string): Promise<AdminUser> {
        const res = await api.put<AdminUser>(`/admin/users/${userId}/role`, { role });
        return res.data;
    },

    async getUserById(userId: string): Promise<AdminUser> {
        const res = await api.get<AdminUser>(`/admin/users/${userId}`);
        return res.data;
    },

    async updateUser(userId: string, payload: UpdateAdminUserPayload): Promise<AdminUser> {
        const res = await api.put<AdminUser>(`/admin/users/${userId}`, payload);
        return res.data;
    }
};