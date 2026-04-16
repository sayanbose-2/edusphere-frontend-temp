import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { Role, Status } from '@/types/enums';
import type { Column } from '@/components/common/DataTable';
import type { IWorkload, IFaculty, ICourse, IDepartment, IPageResponse, ICreateWorkloadRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;

const EMPTY_FORM = { facultyId: '', courseId: '', hours: 0, semester: '', status: Status.ACTIVE as Status };
const EMPTY_DATA = { items: [] as IWorkload[], faculties: [] as IFaculty[], courses: [] as ICourse[] };

const WorkloadPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IWorkload | null>(null);
  const [saving, setSaving] = useState(false);

  const getWorkloads = (r: unknown) => {
    const d = (r as { data: IPageResponse<IWorkload> | IWorkload[] }).data;
    return Array.isArray(d) ? d : (d.content ?? []);
  };

  const load = async () => {
    setLoading(true);
    try {
      if (isFaculty) {
        // faculty sees only their own workload assignments
        const me = await apiClient.get<{ id: string }>('/faculties/me').then(r => r.data);
        const [w, c] = await Promise.all([
          apiClient.get(`/workloads/faculty/${me.id}`).then(getWorkloads),
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])),
        ]);
        setData(d => ({ ...d, items: w, courses: c }));
      } else if (isDeptHead) {
        const [allCourses, depts, allFaculties] = await Promise.all([
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])),
          apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []),
        ]);
        const myDept = depts.find(d => d.headId === user?.id);
        const deptCourseIds = new Set(allCourses.filter(c => c.departmentId === myDept?.id).map(c => c.id));
        const deptFaculties = allFaculties.filter(f => f.departmentId === myDept?.id);

        // load workloads for each dept faculty
        const wArrays = await Promise.all(deptFaculties.map(f => apiClient.get(`/workloads/faculty/${f.id}`).then(getWorkloads).catch(() => [])));
        setData({ items: wArrays.flat(), faculties: deptFaculties, courses: allCourses.filter(c => deptCourseIds.has(c.id)) });
      } else {
        // admin sees everything
        const [w, f, c] = await Promise.all([
          apiClient.get('/workloads').then(getWorkloads),
          apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])),
        ]);
        setData({ items: w, faculties: f, courses: c });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load workloads');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item: IWorkload) => { setSelected(item); setForm({ facultyId: item.facultyId, courseId: item.courseId, hours: item.hours, semester: item.semester, status: item.status }); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ICreateWorkloadRequest = { facultyId: form.facultyId, courseId: form.courseId, hours: form.hours, semester: form.semester, status: form.status };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/workloads/${selected.id}`, payload);
        toast.success('Workload updated');
      } else {
        await apiClient.post('/workloads', payload);
        toast.success('Workload created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save workload'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/workloads/${selected.id}`);
      toast.success('Workload deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete workload'); } finally { setSaving(false); }
  };

  const facultyName = (id: string) => data.faculties.find(f => f.id === id)?.name ?? '—';
  const courseName  = (id: string) => data.courses.find(c => c.id === id)?.title ?? '—';

  const columns: Column<IWorkload>[] = [
    ...(isFaculty ? [] : [{ key: 'facultyId' as const, label: 'Faculty', render: (item: IWorkload) => facultyName(item.facultyId) }]),
    { key: 'courseId', label: 'Course',   render: item => courseName(item.courseId) },
    { key: 'hours',    label: 'Hrs/Week' },
    { key: 'semester', label: 'Semester' },
    { key: 'status',   label: 'Status',   render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Workloads"
        subtitle={isFaculty ? 'Your teaching assignments' : isDeptHead ? 'Faculty workloads for your department' : 'Manage faculty teaching assignments'}
        action={!isFaculty ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Workload</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={!isFaculty ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id}><BsPencil size={13} /></button>
            {isAdmin && <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id}><BsTrash size={13} /></button>}
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Workload' : 'Assign Workload'}</Modal.Title></Modal.Header>
        <Modal.Body>
          {!isFaculty && (
            <div className="mb-3.5">
              <label className="form-label">Faculty</label>
              <select className="form-select" value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
                <option value="">Select faculty member</option>
                {data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          )}
          <div className="mb-3.5">
            <label className="form-label">Course</label>
            <select className="form-select" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
              <option value="">Select course</option>
              {data.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="form-label">Hours / Week</label>
              <input type="number" className="form-control" value={form.hours} onChange={e => setForm(f => ({ ...f, hours: Number(e.target.value) }))} min={0} />
            </div>
            <div>
              <label className="form-label">Semester</label>
              <input className="form-control" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} placeholder="e.g. Fall 2025" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save
          </button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default WorkloadPage;
