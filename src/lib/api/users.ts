import { apiClient } from './client';
import { User, PaginatedResult, UserRole } from '@/types';

export interface CreateUserPayload {
  name: string;
  phoneNumber: string;
  password: string;
  role: UserRole;
  batchLabel?: string;
  notes?: string;
  email?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phoneNumber?: string;
  password?: string;
  role?: UserRole;
  batchLabel?: string;
  notes?: string;
  email?: string;
}

export interface GetUsersQuery {
  name?: string;
  role?: UserRole;
  batchLabel?: string;
  sortBy?: string;
  limit?: number;
  page?: number;
}

export const usersApi = {
  getUsers: async (params?: GetUsersQuery): Promise<PaginatedResult<User>> => {
    const { data } = await apiClient.get<PaginatedResult<User>>('/users', { params });
    return data;
  },

  getUserById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get<User>(`/users/${id}`);
    return data;
  },

  createUser: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await apiClient.post<User>('/users', payload);
    return data;
  },

  updateUser: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/users/${id}`, payload);
    return data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
