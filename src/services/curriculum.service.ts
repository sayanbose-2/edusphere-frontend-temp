import apiClient from '@/api/client';
import type { Curriculum, CreateCurriculumRequest } from '@/types/academic.types';
import type { ApiResponse } from '@/types/compliance.types';

export const curriculumService = {
  getAll: () =>
    apiClient.get<Curriculum[]>('/curriculums').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Curriculum>(`/curriculums/${id}`).then((r) => r.data),

  create: (data: CreateCurriculumRequest) =>
    apiClient.post<Curriculum>('/curriculums', data).then((r) => r.data),

  update: (id: string, data: CreateCurriculumRequest) =>
    apiClient.put<ApiResponse>(`/curriculums/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/curriculums/${id}`),
};
