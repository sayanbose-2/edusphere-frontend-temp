const TW_SUCCESS = 'text-success bg-success/10';
const TW_DANGER = 'text-danger bg-danger/10';
const TW_WARNING = 'text-warning bg-warning/10';
const TW_BLUE = 'text-blue bg-blue-dim';
const TW_INFO = 'text-info bg-info/10';
const TW_PURPLE = 'text-purple-600 bg-purple-100/60 dark:text-purple-400 dark:bg-purple-900/20';
const TW_NEUTRAL = 'text-secondary bg-secondary-100 dark:bg-secondary-800';

const MAP: Record<string, { label: string; tw: string; }> = {
  ACTIVE: { label: 'Active', tw: TW_SUCCESS },
  INACTIVE: { label: 'Inactive', tw: TW_NEUTRAL },
  PENDING: { label: 'Pending', tw: TW_WARNING },
  COMPLETED: { label: 'Completed', tw: TW_BLUE },
  FLAGGED: { label: 'Flagged', tw: TW_DANGER },
  PASS: { label: 'Pass', tw: TW_SUCCESS },
  PASSED: { label: 'Pass', tw: TW_SUCCESS },
  FAIL: { label: 'Fail', tw: TW_DANGER },
  FAILED: { label: 'Fail', tw: TW_DANGER },
  IN_PROGRESS: { label: 'In Progress', tw: TW_INFO },
  SUBMITTED: { label: 'Submitted', tw: TW_PURPLE },
  APPROVED: { label: 'Approved', tw: TW_SUCCESS },
  REJECTED: { label: 'Rejected', tw: TW_DANGER },
  ON_HOLD: { label: 'On Hold', tw: TW_WARNING },
  CANCELLED: { label: 'Cancelled', tw: TW_NEUTRAL },
  COMPLIANT: { label: 'Compliant', tw: TW_SUCCESS },
  NON_COMPLIANT: { label: 'Non-Compliant', tw: TW_DANGER },
  PARTIALLY_COMPLIANT: { label: 'Partial', tw: TW_WARNING },
  DEFERRED: { label: 'Deferred', tw: TW_PURPLE },
  NOT_APPLICABLE: { label: 'N/A', tw: TW_NEUTRAL },
  UNDER_REVIEW: { label: 'Under Review', tw: TW_INFO },
  EXEMPTED: { label: 'Exempted', tw: TW_PURPLE },
  INFO: { label: 'Info', tw: TW_INFO },
  WARN: { label: 'Warn', tw: TW_WARNING },
  WARNING: { label: 'Warning', tw: TW_WARNING },
  ERROR: { label: 'Error', tw: TW_DANGER },
  CRITICAL: { label: 'Critical', tw: TW_PURPLE },
  MIDTERM: { label: 'Midterm', tw: TW_BLUE },
  FINAL: { label: 'Final', tw: TW_DANGER },
  QUIZ: { label: 'Quiz', tw: TW_INFO },
  ASSIGNMENT: { label: 'Assignment', tw: TW_NEUTRAL },
};

const StatusBadge = ({ status }: { status: string; }) => {
  const key = (status ?? '').toUpperCase();
  const cfg = MAP[key] ?? { label: status.replace(/_/g, ' '), tw: TW_NEUTRAL };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider whitespace-nowrap ${cfg.tw}`}>
      {cfg.label}
    </span>
  );
};

export { StatusBadge };
export default StatusBadge;
