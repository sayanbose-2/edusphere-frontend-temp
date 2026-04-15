import apiClient from '@/api/client';
import type { Student, CreateStudentRequest, StudentSelfCreateRequest, PageResponse } from '@/types/academic.types';

export const studentService = {
  getAll: () =>
    apiClient.get<PageResponse<Student>>('/students').then((r) => r.data.content ?? []),

  getMe: () =>
    apiClient.get<Student>('/students/me').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Student>(`/students/${id}`).then((r) => r.data),

  /** Admin creates a full student profile via POST /students */
  create: (data: CreateStudentRequest) =>
    apiClient.post<Student>('/students', data).then((r) => r.data),

  /** Student self-completes their profile on first login via POST /students/me */
  createMe: (data: StudentSelfCreateRequest) =>
    apiClient.post<Student>('/students/me', data).then((r) => r.data),

  update: (id: string, data: CreateStudentRequest) =>
    apiClient.put<Student>(`/students/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/students/${id}`),
};
