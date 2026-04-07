import { useState, useEffect, useMemo } from 'react';
import { Form } from 'react-bootstrap';
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
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [resourceFilter, setResourceFilter] = useState('');

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

  // Client-side filtering — avoids calling /severity or /type endpoints
  // which are ADMIN-only on the backend (Compliance Officers would get 403)
  const items = useMemo(() => {
    let filtered = allItems;
    if (severityFilter) filtered = filtered.filter((l) => l.severity === severityFilter);
    if (resourceFilter) filtered = filtered.filter((l) =>
      l.resource?.toLowerCase().includes(resourceFilter.toLowerCase()));
    return filtered;
  }, [allItems, severityFilter, resourceFilter]);

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

      <div className="d-flex gap-3 mb-3 flex-wrap">
        <Form.Group className="d-flex align-items-center gap-2">
          <Form.Label className="mb-0 small text-nowrap">Severity:</Form.Label>
          <Form.Select
            size="sm"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="INFO">Info</option>
            <option value="WARN">Warn</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Critical</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="d-flex align-items-center gap-2">
          <Form.Label className="mb-0 small text-nowrap">Resource:</Form.Label>
          <Form.Control
            size="sm"
            type="text"
            placeholder="Filter by resource"
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            style={{ maxWidth: 220 }}
          />
        </Form.Group>
      </div>

      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  );
}
