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
    } catch { toast.error('Failed to load audit logs'); }
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
    { key: 'timestamp', label: 'Timestamp' },
  ];

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="View system audit logs (read-only)" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, whiteSpace: 'nowrap', color: 'var(--text-2)' }}>Severity:</label>
          <select className="form-select form-select-sm" value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ width: 130 }}>
            <option value="">All</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, whiteSpace: 'nowrap', color: 'var(--text-2)' }}>Resource:</label>
          <input className="form-control form-control-sm" value={resourceFilter} onChange={e => setResourceFilter(e.target.value)} placeholder="Filter by resource" style={{ width: 220 }} />
        </div>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
