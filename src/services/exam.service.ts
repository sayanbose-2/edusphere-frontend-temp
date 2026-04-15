import apiClient from '@/api/client';
import type { Exam, CreateExamRequest, PageResponse } from '@/types/academic.types';
import type { Status } from '@/types/enums';

export const examService = {
  getAll: () =>
    apiClient.get<PageResponse<Exam>>('/exams').then((r) => r.data.content ?? []),

  getByStatus: (status: Status) =>
    apiClient.get<PageResponse<Exam>>(`/exams/status/${status}`).then((r) => r.data.content ?? []),

  getById: (id: string) =>
    apiClient.get<Exam>(`/exams/${id}`).then((r) => r.data),

  getByCourse: (courseId: string) =>
    apiClient.get<PageResponse<Exam>>(`/exams/course/${courseId}`).then((r) => r.data.content ?? []),

  create: (data: CreateExamRequest) =>
    apiClient.post<Exam>('/exams', data).then((r) => r.data),

  update: (id: string, data: CreateExamRequest) =>
    apiClient.put<Exam>(`/exams/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/exams/${id}`),
};
