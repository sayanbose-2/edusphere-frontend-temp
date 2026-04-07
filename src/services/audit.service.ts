import apiClient from '@/api/client';
import { Severity } from '@/types/enums';
import type { Audit, AuditLog, ReviewAuditRequest } from '@/types/compliance.types';

export const auditService = {
  getAll: () =>
    apiClient.get<Audit[]>('/audits').then((r) => r.data),

  review: (auditId: string, data: ReviewAuditRequest) =>
    apiClient.put<Audit>(`/audits/${auditId}/review`, data).then((r) => r.data),
};

export const auditLogService = {
  getAll: () =>
    apiClient.get<AuditLog[]>('/audit-logs').then((r) => r.data),

  getBySeverity: (severity: Severity) =>
    apiClient.get<AuditLog[]>(`/audit-logs/severity/${severity}`).then((r) => r.data),

  getByUser: (userId: string) =>
    apiClient.get<AuditLog[]>(`/audit-logs/user/${userId}`).then((r) => r.data),

  getByResource: (resource: string) =>
    apiClient.get<AuditLog[]>(`/audit-logs/resource/${resource}`).then((r) => r.data),

  getByType: (logType: string) =>
    apiClient.get<AuditLog[]>(`/audit-logs/type/${logType}`).then((r) => r.data),
};
