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
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rpData, facData] = await Promise.all([
          researchService.getAll(),
          facultyService.getAll(),
        ]);
        setProjects(rpData);
        setFaculties(facData);
      } catch {
        toast.error('Failed to load research projects');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getFacultyName = (id: string) => faculties.find((f) => f.id === id)?.name || '—';

  const columns: Column<ResearchProject>[] = [
    { key: 'title', label: 'Title' },
    {
      key: 'facultyId',
      label: 'Faculty Lead',
      render: (item) => getFacultyName(item.facultyId),
    },
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
      <PageHeader
        title="Research Projects"
        subtitle="Browse research projects"
      />

      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
      />
    </div>
  );
}
