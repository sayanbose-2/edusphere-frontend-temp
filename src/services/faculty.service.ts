import apiClient from '@/api/client';
import type { Faculty, CreateFacultyRequest, FacultySelfCreateRequest, PageResponse } from '@/types/academic.types';

export const facultyService = {
  getAll: () =>
    apiClient.get<PageResponse<Faculty>>('/faculties').then((r) => r.data.content ?? []),

  getMe: () =>
    apiClient.get<Faculty>('/faculties/me').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Faculty>(`/faculties/${id}`).then((r) => r.data),

  /** Admin creates a full faculty profile via POST /faculties (includes departmentId, position, status) */
  create: (data: CreateFacultyRequest) =>
    apiClient.post<Faculty>('/faculties', data).then((r) => r.data),

  /** Faculty self-creates their profile stub on first login via POST /faculties/me */
  createMe: (data: FacultySelfCreateRequest) =>
    apiClient.post<Faculty>('/faculties/me', data).then((r) => r.data),

  update: (id: string, data: CreateFacultyRequest) =>
    apiClient.put<Faculty>(`/faculties/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/faculties/${id}`),

  getByDepartment: (departmentId: string) =>
    apiClient.get<PageResponse<Faculty>>(`/departments/${departmentId}/faculty`).then((r) => r.data.content ?? []),
};
