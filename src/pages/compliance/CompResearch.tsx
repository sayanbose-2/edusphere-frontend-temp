import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { researchService } from '@/services/research.service';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ResearchProject } from '@/types/academic.types';

export default function CompResearch() {
  const [items, setItems] = useState<ResearchProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    researchService.getAll()
      .then(setItems)
      .catch(() => toast.error('Failed to load research projects'))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<ResearchProject>[] = [
    { key: 'title',     label: 'Title' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate',   label: 'End Date' },
    { key: 'status',    label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Research Projects" subtitle="View research projects (read-only)" />
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
