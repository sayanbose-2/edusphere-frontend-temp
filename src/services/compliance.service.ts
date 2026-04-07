import apiClient from '@/api/client';
import type { ComplianceRecord, CreateComplianceRecordRequest, ApiResponse } from '@/types/compliance.types';

export const complianceService = {
  getAll: () =>
    apiClient.get<ComplianceRecord[]>('/compliance-records').then((r) => r.data),

  create: (data: CreateComplianceRecordRequest) =>
    apiClient.post<ComplianceRecord>('/compliance-records', data).then((r) => r.data),

  update: (id: string, data: CreateComplianceRecordRequest) =>
    apiClient.put<ApiResponse>(`/compliance-records/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/compliance-records/${id}`),
};
