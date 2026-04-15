import { AuditStatus, Severity, ComplianceResult, ComplianceEntityType, NotificationType, ReportScope, Status, ComplianceType } from '@/types/enums';
import type { BaseEntity } from '@/types/academic.types';

// Structured success response returned by mutation endpoints
export interface ApiResponse {
  message: string;
  status: number;
  timeStamp: string;
}

// ========================
// Audit
// ========================

export interface Audit {
  id: string;
  complianceOfficerId: string;
  entityType: string;
  entityId: string;
  scope: string;
  findings?: string;
  auditDate: string;
  status: AuditStatus;
}

export interface ReviewAuditRequest {
  findings: string;
  status: AuditStatus;
}

// ========================
// Audit Log
// ========================

export interface AuditLog extends BaseEntity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  severity: Severity;
  createdAt: string;
  details?: string;
  logType: string;
}

// ========================
// Compliance Record
// ========================

export interface ComplianceRecord {
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

export interface CreateComplianceRecordRequest {
  recordedByUserId: string;
  entityId: string;
  entityType: ComplianceEntityType;
  complianceType: ComplianceType;
  result: ComplianceResult;
  complianceDate: string;
  notes: string;
}

// ========================
// Notification
// ========================

export interface Notification {
  id: string;
  userId: string;
  entityId?: string;
  message: string;
  category: NotificationType;
  isRead: boolean;
}

export interface SendNotificationRequest {
  userId: string;
  entityId: string;
  message: string;
  category: NotificationType;
  isRead: boolean;
}

export interface BroadcastNotificationRequest {
  message: string;
  category: NotificationType;
}

// ========================
// Report
// ========================

export interface Report {
  id: string;
  metrics: string;
  status: Status;
  scope: ReportScope;
  department: string;
  generatedBy: { id: string; name: string } | string;
}

export interface CreateReportRequest {
  generatedBy: string;
  departmentId: string;
  scope: ReportScope;
  metrics: string;
  status?: Status;
}
