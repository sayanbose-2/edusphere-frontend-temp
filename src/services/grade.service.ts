import apiClient from '@/api/client';
import type { Grade, CreateGradeRequest } from '@/types/academic.types';

export const gradeService = {
  getAll: () =>
    apiClient.get<Grade[]>('/grades').then((r) => r.data),

  getMy: () =>
    apiClient.get<Grade[]>('/grades/my').then((r) => r.data),

  getByStudent: (studentId: string) =>
    apiClient.get<Grade[]>(`/grades/students/${studentId}`).then((r) => r.data),

  getByExam: (examId: string) =>
    apiClient.get<Grade[]>(`/grades/exam/${examId}`).then((r) => r.data),

  create: (data: CreateGradeRequest) =>
    apiClient.post<Grade>('/grades', data).then((r) => r.data),

  update: (id: string, data: CreateGradeRequest) =>
    apiClient.put<Grade>(`/grades/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/grades/${id}`),
};
