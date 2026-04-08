const MAP: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE:              { label: 'Active',           color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   },
  INACTIVE:            { label: 'Inactive',          color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  PENDING:             { label: 'Pending',           color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  COMPLETED:           { label: 'Completed',         color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  FLAGGED:             { label: 'Flagged',           color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  PASS:                { label: 'Pass',              color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   },
  PASSED:              { label: 'Pass',              color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   },
  FAIL:                { label: 'Fail',              color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  FAILED:              { label: 'Fail',              color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  IN_PROGRESS:         { label: 'In Progress',       color: '#0284C7', bg: 'rgba(2,132,199,0.1)'   },
  SUBMITTED:           { label: 'Submitted',         color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  APPROVED:            { label: 'Approved',          color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   },
  REJECTED:            { label: 'Rejected',          color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  ON_HOLD:             { label: 'On Hold',           color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  CANCELLED:           { label: 'Cancelled',         color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
  COMPLIANT:           { label: 'Compliant',         color: '#16A34A', bg: 'rgba(22,163,74,0.1)'   },
  NON_COMPLIANT:       { label: 'Non-Compliant',     color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  PARTIALLY_COMPLIANT: { label: 'Partial',           color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  UNDER_REVIEW:        { label: 'Under Review',      color: '#0284C7', bg: 'rgba(2,132,199,0.1)'   },
  EXEMPTED:            { label: 'Exempted',          color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  INFO:                { label: 'Info',              color: '#0284C7', bg: 'rgba(2,132,199,0.1)'   },
  WARN:                { label: 'Warn',              color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  WARNING:             { label: 'Warning',           color: '#D97706', bg: 'rgba(217,119,6,0.1)'   },
  ERROR:               { label: 'Error',             color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  CRITICAL:            { label: 'Critical',          color: '#7C3AED', bg: 'rgba(124,58,237,0.1)'  },
  MIDTERM:             { label: 'Midterm',           color: '#2563EB', bg: 'rgba(37,99,235,0.1)'   },
  FINAL:               { label: 'Final',             color: '#DC2626', bg: 'rgba(220,38,38,0.1)'   },
  QUIZ:                { label: 'Quiz',              color: '#0284C7', bg: 'rgba(2,132,199,0.1)'   },
  ASSIGNMENT:          { label: 'Assignment',        color: '#64748B', bg: 'rgba(100,116,139,0.1)' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = MAP[status] ?? { label: status.replace(/_/g, ' '), color: '#64748B', bg: 'rgba(100,116,139,0.1)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: 20,
      fontSize: 11, fontWeight: 700, letterSpacing: 0.3,
      color: cfg.color, background: cfg.bg,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

export default StatusBadge;
