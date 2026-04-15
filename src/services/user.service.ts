import apiClient from '@/api/client';
import { Role, Status } from '@/types/enums';
import type { User, PageResponse } from '@/types/academic.types';

export const userService = {
  getAll: () =>
    apiClient.get<PageResponse<User>>('/users').then((r) => r.data.content ?? []),

  update: (id: string, data: Partial<User>) =>
    apiClient.patch<User>(`/users/${id}`, data).then((r) => r.data),

  updateRoles: (id: string, roles: Role[], replaceRoles: boolean) =>
    apiClient.patch<User>(`/users/${id}`, { roles, replaceRoles }).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/users/${id}`),

  toggleStatus: (id: string, status: Status) =>
    apiClient.patch(`/users/${id}/status`, { status }),
};
