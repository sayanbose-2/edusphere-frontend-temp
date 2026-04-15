import apiClient from '@/api/client';
import type { AuthResponse, LoginRequest, RegisterRequest, ChangePasswordRequest } from '@/types/auth.types';

export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<AuthResponse>('/auth/refresh', { refreshToken }).then((r) => r.data),

  changePassword: (data: ChangePasswordRequest) =>
    apiClient.patch('/auth/change-password', data),
};
