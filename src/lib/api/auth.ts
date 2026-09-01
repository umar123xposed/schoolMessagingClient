import { apiClient } from './client';
import { AuthResponse, AuthTokens } from '@/types';

export const authApi = {
  login: async (credentials: { phoneNumber: string; password: string }): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  refreshTokens: async (refreshToken: string): Promise<AuthTokens> => {
    const { data } = await apiClient.post<AuthTokens>('/auth/refresh-tokens', { refreshToken });
    return data;
  },
};
