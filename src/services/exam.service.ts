import apiClient from '@/api/client';
import type { Exam, CreateExamRequest } from '@/types/academic.types';

export const examService = {
  getAll: () =>
    apiClient.get<Exam[]>('/exams').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Exam>(`/exams/${id}`).then((r) => r.data),

  create: (data: CreateExamRequest) =>
    apiClient.post<Exam>('/exams', data).then((r) => r.data),

  update: (id: string, data: CreateExamRequest) =>
    apiClient.put<Exam>(`/exams/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/exams/${id}`),
};
