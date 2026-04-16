import { AuditStatus, Severity, ComplianceResult, ComplianceEntityType, NotificationType, ReportScope, Status, ComplianceType } from '@/types/enums';
import type { IBaseEntity } from '@/types/academicTypes';

export interface IApiResponse {
  message: string;
  status: number;
  timeStamp: string;
}

export interface IAudit {
  id: string;
  complianceOfficerId: string;
  entityType: string;
  entityId: string;
  scope: string;
  findings?: string;
  auditDate: string;
  status: AuditStatus;
}

export interface IReviewAuditRequest {
  findings: string;
  status: AuditStatus;
}

export interface IAuditLog extends IBaseEntity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  severity: Severity;
  createdAt: string;
  details?: string;
  logType: string;
}

export interface IComplianceRecord {
  id: string;
  recordedByUserId: string;
  entityId: string;
  entityType: ComplianceEntityType;
  complianceType: ComplianceType;
  result: ComplianceResult;
  complianceDate: string;
  notes: string;
  createdAt: string;
}

export interface ICreateComplianceRecordRequest {
  recordedByUserId: string;
  entityId: string;
  entityType: ComplianceEntityType;
  complianceType: ComplianceType;
  result: ComplianceResult;
  complianceDate: string;
  notes: string;
}

export interface INotification {
  id: string;
  userId: string;
  entityId?: string;
  message: string;
  category: NotificationType;
  isRead: boolean;
}

export interface ISendNotificationRequest {
  userId: string;
  entityId: string;
  message: string;
  category: NotificationType;
  isRead: boolean;
}

export interface IBroadcastNotificationRequest {
  message: string;
  category: NotificationType;
}

export interface IReport {
  id: string;
  metrics: string;
  status: Status;
  scope: ReportScope;
  department: string;
  generatedBy: { id: string; name: string } | string;
}

export interface ICreateReportRequest {
  generatedBy: string;
  departmentId: string;
  scope: ReportScope;
  metrics: string;
  status?: Status;
}
