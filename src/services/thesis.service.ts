import apiClient from '@/api/client';
import type { Thesis, CreateThesisRequest } from '@/types/academic.types';

export const thesisService = {
  getAll: () =>
    apiClient.get<Thesis[]>('/thesis').then((r) => r.data),

  getMy: () =>
    apiClient.get<Thesis[]>('/thesis/my').then((r) => r.data),

  getByStudent: (studentId: string) =>
    apiClient.get<Thesis[]>(`/thesis/student/${studentId}`).then((r) => r.data),

  create: (data: CreateThesisRequest) =>
    apiClient.post<Thesis>('/thesis', data).then((r) => r.data),

  update: (id: string, data: CreateThesisRequest) =>
    apiClient.put<Thesis>(`/thesis/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/thesis/${id}`),
};
