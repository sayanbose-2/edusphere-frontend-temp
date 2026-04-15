import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Faculty, Department } from '@/types/academic.types';

export default function DeptFaculty() {
  const { user } = useAuth();
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [myDept, setMyDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const allDepts = await departmentService.getAll();
        const found = allDepts.find(d => d.headId === user?.id) || null;
        setMyDept(found);
        const data = found ? await facultyService.getByDepartment(found.id) : await facultyService.getAll();
        setFaculty(data);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 500) toast.error('Failed to load faculty data');
      }
      finally { setLoading(false); }
    };
    load();
  }, [user?.id]);

  const columns: Column<Faculty>[] = [
    { key: 'name',     label: 'Name' },
    { key: 'email',    label: 'Email' },
    { key: 'phone',    label: 'Phone' },
    { key: 'position', label: 'Position' },
    { key: 'joinDate', label: 'Join Date', render: item => item.joinDate ? new Date(item.joinDate).toLocaleDateString() : '—' },
    { key: 'status',   label: 'Status',    render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Department Faculty" subtitle={myDept ? `Faculty members in ${myDept.departmentName}` : 'All faculty members'} />
      <DataTable columns={columns} data={faculty} loading={loading} />
    </>
  );
}
