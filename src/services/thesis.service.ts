import apiClient from '@/api/client';
import type { Thesis, CreateThesisRequest, PageResponse } from '@/types/academic.types';

export const thesisService = {
  getAll: () =>
    apiClient.get<PageResponse<Thesis>>('/theses').then((r) => r.data.content ?? []),

  getMy: () =>
    apiClient.get<PageResponse<Thesis>>('/theses/my').then((r) => r.data.content ?? []),

  getByStudent: (studentId: string) =>
    apiClient.get<PageResponse<Thesis>>(`/theses/student/${studentId}`).then((r) => r.data.content ?? []),

  create: (data: CreateThesisRequest) =>
    apiClient.post<Thesis>('/theses', data).then((r) => r.data),

  update: (id: string, data: CreateThesisRequest) =>
    apiClient.put<Thesis>(`/theses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/theses/${id}`),
};
