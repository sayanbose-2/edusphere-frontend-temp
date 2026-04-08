import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { researchService } from '@/services/research.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ResearchProject, Faculty } from '@/types/academic.types';

export default function StudentResearch() {
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([researchService.getAll(), facultyService.getAll()])
      .then(([rp, fac]) => { setProjects(rp); setFaculties(fac); })
      .catch(() => toast.error('Failed to load research projects'))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<ResearchProject>[] = [
    { key: 'title',     label: 'Title' },
    { key: 'facultyId', label: 'Faculty Lead', render: item => faculties.find(f => f.id === item.facultyId)?.name ?? '—' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate',   label: 'End Date' },
    { key: 'status',    label: 'Status',      render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Research Projects" subtitle="Browse research projects" />
      <DataTable columns={columns} data={projects} loading={loading} />
    </>
  );
}
