import apiClient from '@/api/client';
import type { Department, CreateDepartmentRequest, PageResponse } from '@/types/academic.types';

export const departmentService = {
  getAll: () =>
    apiClient.get<PageResponse<Department>>('/departments').then((r) => r.data.content ?? []),

  getById: (id: string) =>
    apiClient.get<Department>(`/departments/${id}`).then((r) => r.data),

  create: (data: CreateDepartmentRequest) =>
    apiClient.post<Department>('/departments', data).then((r) => r.data),

  update: (id: string, data: CreateDepartmentRequest) =>
    apiClient.put<Department>(`/departments/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/departments/${id}`),

  assignHead: (departmentId: string, headId: string) =>
    apiClient.patch(`/departments/${departmentId}/head`, null, { params: { headId } }),
};
