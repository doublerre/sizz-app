import api from "./api";

export interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
}

export const adminService = {
  getUsers: async (page = 0, size = 10) => {
    const { data } = await api.get(`/admin/users?page=${page}&size=${size}`);
    return data;
  },
  updateRole: async (userId: string, role: string): Promise<UserItem> => {
    const { data } = await api.put(`/admin/users/${userId}/role`, { role });
    return data;
  },
};
