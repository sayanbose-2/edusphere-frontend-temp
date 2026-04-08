import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { complianceService } from '@/services/compliance.service';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { ComplianceRecord } from '@/types/compliance.types';

export default function DeptCompliance() {
  const [items, setItems] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    complianceService.getAll()
      .then(setItems)
      .catch(() => toast.error('Failed to load compliance records'))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<ComplianceRecord>[] = [
    { key: 'entityType',     label: 'Entity Type', render: item => formatEnum(item.entityType) },
    { key: 'entityId',       label: 'Entity ID' },
    { key: 'result',         label: 'Result',      render: item => <StatusBadge status={item.result} /> },
    { key: 'notes',          label: 'Notes',       render: item => item.notes ? (item.notes.length > 80 ? item.notes.slice(0, 80) + '…' : item.notes) : '—' },
    { key: 'complianceDate', label: 'Date' },
  ];

  return (
    <>
      <PageHeader title="Compliance Records" subtitle="View compliance records (read-only)" />
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
