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
    const loadData = async () => {
      try {
        const rp = await researchService.getAll();
        setProjects(rp);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 403 && status !== 404 && status !== 500) toast.error('Failed to load research projects');
      }
      // Faculty list is used only for names — student may not have access
      try { const fac = await facultyService.getAll(); setFaculties(fac); } catch { /* student role may lack permission */ }
      setLoading(false);
    };
    loadData();
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
