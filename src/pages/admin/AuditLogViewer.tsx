import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { auditLogService } from '@/services/audit.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { AuditLog } from '@/types/compliance.types';

export default function AuditLogViewer() {
  const [allItems, setAllItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');

  useEffect(() => {
    (async () => {
      try { setLoading(true); setAllItems(await auditLogService.getAll()); }
      catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 500) toast.error('Failed to load audit logs');
      }
      finally { setLoading(false); }
    })();
  }, []);

  const items = severityFilter ? allItems.filter(l => l.severity === severityFilter) : allItems;

  const columns: Column<AuditLog>[] = [
    { key: 'action',    label: 'Action' },
    { key: 'resource',  label: 'Resource' },
    { key: 'logType',   label: 'Type', render: item => formatEnum(item.logType) },
    { key: 'severity',  label: 'Severity', render: item => <StatusBadge status={item.severity} /> },
    { key: 'details',   label: 'Details', render: item => item.details ? (item.details.length > 60 ? item.details.slice(0, 60) + '…' : item.details) : '—' },
    { key: 'createdAt', label: 'Timestamp', render: item => item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
  ];

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="System activity log — read only" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Filter by severity</label>
        <select className="form-select form-select-sm" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ maxWidth: 160 }}>
          <option value="">All</option>
          <option value="INFO">Info</option>
          <option value="WARN">Warn</option>
          <option value="ERROR">Error</option>
          <option value="CRITICAL">Critical</option>
        </select>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
