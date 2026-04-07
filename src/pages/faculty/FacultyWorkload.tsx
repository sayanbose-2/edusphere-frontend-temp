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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wlData, courseData] = await Promise.all([
        workloadService.getByFaculty(user!.id),
        courseService.getAll(),
      ]);
      setItems(wlData);
      setCourses(courseData);
    } catch {
      toast.error('Failed to load workload');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.title || '—';

  const columns: Column<Workload>[] = [
    {
      key: 'courseId',
      label: 'Course',
      render: (item) => getCourseName(item.courseId),
    },
    { key: 'hours', label: 'Hours' },
    { key: 'semester', label: 'Semester' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Workload"
        subtitle="View your teaching workload assignments"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
      />
    </div>
  );
}
