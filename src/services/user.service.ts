import apiClient from '@/api/client';
import { Status } from '@/types/enums';
import type { User } from '@/types/academic.types';

export const userService = {
  getAll: () =>
    apiClient.get<User[]>('/users').then((r) => r.data),

  update: (id: string, data: Partial<User>) =>
    apiClient.post<User>(`/users/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),

  toggleStatus: (id: string, status: Status) =>
    apiClient.patch(`/users/${id}/status`, { status }),
};
