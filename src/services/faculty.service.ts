import apiClient from '@/api/client';
import type { Faculty, CreateFacultyRequest } from '@/types/academic.types';

export const facultyService = {
  getAll: () =>
    apiClient.get<Faculty[]>('/faculties').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Faculty>(`/faculties/${id}`).then((r) => r.data),

  create: (data: CreateFacultyRequest) =>
    apiClient.post<Faculty>('/faculties', data).then((r) => r.data),

  update: (id: string, data: Partial<Faculty>) =>
    apiClient.put<Faculty>(`/faculties/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/faculties/${id}`),

  getByDepartment: (departmentId: string) =>
    apiClient.get<Faculty[]>(`/departments/${departmentId}/faculty`).then((r) => r.data),
};
