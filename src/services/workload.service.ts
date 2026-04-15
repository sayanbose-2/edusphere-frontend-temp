import apiClient from '@/api/client';
import type { Workload, CreateWorkloadRequest, PageResponse } from '@/types/academic.types';

export const workloadService = {
  getAll: () =>
    apiClient.get<PageResponse<Workload> | Workload[]>('/workloads').then((r) =>
      Array.isArray(r.data) ? r.data : (r.data.content ?? [])
    ),

  getByFaculty: (facultyId: string) =>
    apiClient.get<PageResponse<Workload> | Workload[]>(`/workloads/faculty/${facultyId}`).then((r) =>
      Array.isArray(r.data) ? r.data : (r.data.content ?? [])
    ),

  create: (data: CreateWorkloadRequest) =>
    apiClient.post<Workload>('/workloads', data).then((r) => r.data),

  update: (id: string, data: CreateWorkloadRequest) =>
    apiClient.put<Workload>(`/workloads/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/workloads/${id}`),
};
