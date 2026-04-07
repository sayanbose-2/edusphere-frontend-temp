import apiClient from '@/api/client';
import type { Student, CreateStudentRequest } from '@/types/academic.types';

export const studentService = {
  getAll: () =>
    apiClient.get<Student[]>('/students').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Student>(`/students/${id}`).then((r) => r.data),

  create: (data: CreateStudentRequest) =>
    apiClient.post<Student>('/students', data).then((r) => r.data),

  update: (id: string, data: Partial<Student>) =>
    apiClient.put<Student>(`/students/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/students/${id}`),
};
