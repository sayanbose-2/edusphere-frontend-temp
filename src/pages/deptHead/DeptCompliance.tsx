import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { complianceService } from '@/services/compliance.service';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ComplianceRecord } from '@/types/compliance.types';

export default function DeptCompliance() {
  const [items, setItems] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await complianceService.getAll();
      setItems(data);
    } catch {
      toast.error('Failed to load compliance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: Column<ComplianceRecord>[] = [
    { key: 'complianceType', label: 'Compliance Type' },
    { key: 'entityType', label: 'Entity Type' },
    { key: 'entityId', label: 'Entity ID' },
    {
      key: 'result',
      label: 'Result',
      render: (item) => <StatusBadge status={item.result} />,
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (item) => item.notes.length > 80 ? item.notes.substring(0, 80) + '...' : item.notes,
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (item) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        subtitle="View compliance records (read-only)"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
      />
    </div>
  );
}
