interface StatusBadgeProps {
  status: string;
}

const STATUS_COLOR_MAP: Record<string, string> = {
  // Entity status
  ACTIVE: 'success',
  INACTIVE: 'secondary',
  ON_HOLD: 'warning',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'primary',
  REVISION_REQUIRED: 'warning',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  CANCELLED: 'secondary',
  PROPOSED: 'info',
  REVIEWED: 'success',
  FLAGGED: 'danger',
  // ComplianceResult
  COMPLIANT: 'success',
  NON_COMPLIANT: 'danger',
  PARTIALLY_COMPLIANT: 'warning',
  EXEMPTED: 'secondary',
  // Grade result
  PASSED: 'success',
  FAILED: 'danger',
  PASS: 'success',
  FAIL: 'danger',
  DEFERRED: 'warning',
  NOT_APPLICABLE: 'secondary',
  // Severity
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'danger',
  WARNING: 'warning',
  CRITICAL: 'danger',
  // Exam types
  MIDTERM: 'primary',
  FINAL: 'danger',
  QUIZ: 'info',
  ASSIGNMENT: 'secondary',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const variant = STATUS_COLOR_MAP[status] ?? 'secondary';
  return (
    <span className={`badge badge-status-${variant}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

export default StatusBadge;
