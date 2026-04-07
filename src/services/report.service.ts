import apiClient from '@/api/client';
import type { Report, CreateReportRequest } from '@/types/compliance.types';

export const reportService = {
  getAll: () =>
    apiClient.get<Report[]>('/reports').then((r) => r.data),

  create: (data: CreateReportRequest) =>
    apiClient.post<Report>('/reports', data).then((r) => r.data),

  update: (id: string, data: CreateReportRequest) =>
    apiClient.put<Report>(`/reports/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/reports/${id}`),

  getByDepartment: (departmentId: string) =>
    apiClient.get<Report[]>(`/reports/department/${departmentId}`).then((r) => r.data),
};
