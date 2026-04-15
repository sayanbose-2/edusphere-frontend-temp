import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { auditLogService } from '@/services/audit.service';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { AuditLog } from '@/types/compliance.types';

export default function CompAuditLogs() {
  const [allItems, setAllItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setAllItems(await auditLogService.getAll());
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load audit logs');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const items = useMemo(() => {
    let f = allItems;
    if (severityFilter) f = f.filter(l => l.severity === severityFilter);
    if (resourceFilter) f = f.filter(l => l.resource?.toLowerCase().includes(resourceFilter.toLowerCase()));
    return f;
  }, [allItems, severityFilter, resourceFilter]);

  const columns: Column<AuditLog>[] = [
    { key: 'action',    label: 'Action' },
    { key: 'resource',  label: 'Resource' },
    { key: 'logType',   label: 'Type',     render: item => formatEnum(item.logType) },
    { key: 'severity',  label: 'Severity', render: item => <StatusBadge status={item.severity} /> },
    { key: 'details',   label: 'Details',  render: item => item.details ? (item.details.length > 60 ? item.details.slice(0, 60) + '…' : item.details) : '—' },
    { key: 'createdAt', label: 'Timestamp', render: item => item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
  ];

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="View system audit logs (read-only)" />
      <div className="flex gap-3 mb-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <label className="text-sm whitespace-nowrap text-secondary">Severity:</label>
          <select className="form-select form-select-sm w-32" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}>
            <option value="">All</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm whitespace-nowrap text-secondary">Resource:</label>
          <input className="form-control form-control-sm w-56" value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} placeholder="Filter by resource" />
        </div>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
