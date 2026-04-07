import { useState, useEffect } from 'react';
import { Form } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { auditLogService } from '@/services/audit.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { AuditLog } from '@/types/compliance.types';

export default function AuditLogViewer() {
  const [allItems, setAllItems] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setAllItems(await auditLogService.getAll());
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Client-side filtering — /severity endpoint is ADMIN-only; keep it consistent here too
  const items = severityFilter
    ? allItems.filter((l) => l.severity === severityFilter)
    : allItems;

  const columns: Column<AuditLog>[] = [
    { key: 'action', label: 'Action' },
    { key: 'resource', label: 'Resource' },
    {
      key: 'logType',
      label: 'Type',
      render: (item) => formatEnum(item.logType),
    },
    {
      key: 'severity',
      label: 'Severity',
      render: (item) => <StatusBadge status={item.severity} />,
    },
    {
      key: 'details',
      label: 'Details',
      render: (item) =>
        item.details
          ? item.details.length > 60 ? item.details.substring(0, 60) + '...' : item.details
          : '—',
    },
    { key: 'timestamp', label: 'Timestamp' },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" subtitle="View system audit logs (read-only)" />

      <div className="mb-3">
        <Form.Group className="d-flex align-items-center gap-2" style={{ maxWidth: 300 }}>
          <Form.Label className="mb-0 small text-nowrap">Filter by Severity:</Form.Label>
          <Form.Select size="sm" value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
            <option value="">All</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </Form.Select>
        </Form.Group>
      </div>

      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  );
}
