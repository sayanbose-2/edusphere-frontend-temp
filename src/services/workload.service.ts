import apiClient from '@/api/client';
import type { Workload, CreateWorkloadRequest } from '@/types/academic.types';

export const workloadService = {
  getAll: () =>
    apiClient.get<Workload[]>('/workload').then((r) => r.data),

  getByFaculty: (facultyId: string) =>
    apiClient.get<Workload[]>(`/workload/faculty/${facultyId}`).then((r) => r.data),

  create: (data: CreateWorkloadRequest) =>
    apiClient.post<Workload>('/workload', data).then((r) => r.data),

  update: (id: string, data: CreateWorkloadRequest) =>
    apiClient.put<Workload>(`/workload/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/workload/${id}`),
};
