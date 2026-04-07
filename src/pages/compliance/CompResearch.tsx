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

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await researchService.getAll();
      setItems(data);
    } catch {
      toast.error('Failed to load research projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns: Column<ResearchProject>[] = [
    { key: 'title', label: 'Title' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader title="Research Projects" subtitle="View research projects (read-only)" />

      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  );
}
