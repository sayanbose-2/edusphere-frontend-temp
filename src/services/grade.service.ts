import apiClient from '@/api/client';
import type { Grade, CreateGradeRequest, PageResponse } from '@/types/academic.types';

export const gradeService = {
  getAll: () =>
    apiClient.get<PageResponse<Grade>>('/grades').then((r) => r.data.content ?? []),

  getMy: () =>
    apiClient.get<PageResponse<Grade>>('/grades/my').then((r) => r.data.content ?? []),

  getByStudent: (studentId: string) =>
    apiClient.get<PageResponse<Grade>>(`/grades/students/${studentId}`).then((r) => r.data.content ?? []),

  getByExam: (examId: string) =>
    apiClient.get<PageResponse<Grade>>(`/grades/exam/${examId}`).then((r) => r.data.content ?? []),

  create: (data: CreateGradeRequest) =>
    apiClient.post<Grade>('/grades', data).then((r) => r.data),

  update: (id: string, data: CreateGradeRequest) =>
    apiClient.put<Grade>(`/grades/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/grades/${id}`),
};
