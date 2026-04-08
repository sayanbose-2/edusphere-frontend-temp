import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { workloadService } from '@/services/workload.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import type { Workload, Course } from '@/types/academic.types';

export default function FacultyWorkload() {
  const { user } = useAuth();
  const [items, setItems] = useState<Workload[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([workloadService.getByFaculty(user.id), courseService.getAll()])
      .then(([wl, crs]) => { setItems(wl); setCourses(crs); })
      .catch(() => toast.error('Failed to load workload'))
      .finally(() => setLoading(false));
  }, [user]);

  const columns: Column<Workload>[] = [
    { key: 'courseId', label: 'Course',   render: item => courses.find(c => c.id === item.courseId)?.title ?? '—' },
    { key: 'hours',    label: 'Hours' },
    { key: 'semester', label: 'Semester' },
    { key: 'status',   label: 'Status',   render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="My Workload" subtitle="View your teaching workload assignments" />
      <DataTable columns={columns} data={items} loading={loading} />
    </>
  );
}
