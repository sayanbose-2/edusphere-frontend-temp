import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { facultyService } from '@/services/faculty.service';
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
    const load = async () => {
      try {
        // Resolve the faculty entity ID from the logged-in user's IAM userId
        const faculty = await facultyService.getMe();
        const wl = await workloadService.getByFaculty(faculty.id);
        setItems(wl);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 500) toast.error('Failed to load workload');
      }
      try {
        const crs = await courseService.getAll();
        setCourses(crs);
      } catch {
        // courses are supplementary; ignore failures
      }
      setLoading(false);
    };
    load();
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
