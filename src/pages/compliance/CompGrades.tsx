import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { gradeService } from '@/services/grade.service';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Grade } from '@/types/academic.types';

export default function CompGrades() {
  const [items, setItems] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradeService.getAll()
      .then(setItems)
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 500) toast.error('Failed to load grades');
      })
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<Grade>[] = [
    { key: 'examId',    label: 'Exam ID' },
    { key: 'studentId', label: 'Student ID' },
    { key: 'score',     label: 'Score' },
    { key: 'grade',     label: 'Grade' },
    { key: 'status',    label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Grades" subtitle="View student grades (read-only)" />
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
