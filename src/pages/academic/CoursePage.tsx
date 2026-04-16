import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsToggleOn, BsToggleOff } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { Role, Status } from '@/types/enums';
import type { Column } from '@/components/common/DataTable';
import type { ICourse, IDepartment, IPageResponse, ICreateCourseRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;

const EMPTY_FORM = { title: '', departmentId: '', credits: 3, duration: 1 };
const EMPTY_DATA = { items: [] as ICourse[], departments: [] as IDepartment[] };

const CoursePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<ICourse | null>(null);
  const [saving, setSaving] = useState(false);

  const getCourses = (r: unknown) => {
    const d = (r as { data: IPageResponse<ICourse> | ICourse[] }).data;
    return Array.isArray(d) ? d : (d.content ?? []);
  };

  const load = async () => {
    setLoading(true);
    try {
      const depts = await apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []);

      const allCourses = await apiClient.get('/courses').then(getCourses);
      if (isDeptHead && !isAdmin) {
        const myDept = depts.find(d => d.headId === user?.id);
        setData({ departments: depts, items: myDept ? allCourses.filter((c: ICourse) => c.departmentId === myDept.id) : [] });
      } else {
        setData({ departments: depts, items: allCourses });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load courses');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item: ICourse) => { setSelected(item); setForm({ title: item.title, departmentId: item.departmentId, credits: item.credits, duration: item.duration }); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ICreateCourseRequest = { title: form.title, departmentId: form.departmentId, credits: form.credits, duration: form.duration, status: Status.ACTIVE };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/courses/${selected.id}`, payload);
        toast.success('Course updated');
      } else {
        await apiClient.post('/courses', payload);
        toast.success('Course created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save course'); } finally { setSaving(false); }
  };

  const handleToggle = async (item: ICourse) => {
    try {
      const newStatus = item.status === 'ACTIVE' ? Status.INACTIVE : Status.ACTIVE;
      await apiClient.put(`/courses/${item.id}/status`, JSON.stringify(newStatus), { headers: { 'Content-Type': 'application/json' } });
      toast.success('Status updated'); load();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/courses/${selected.id}`);
      toast.success('Course deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete course'); } finally { setSaving(false); }
  };

  const deptName = (id: string) => data.departments.find(d => d.id === id)?.departmentName ?? '—';

  const columns: Column<ICourse>[] = [
    { key: 'title',        label: 'Title' },
    { key: 'departmentId', label: 'Department', render: item => deptName(item.departmentId) },
    { key: 'credits',      label: 'Credits' },
    { key: 'duration',     label: 'Duration (sem)' },
    { key: 'status',       label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Courses"
        subtitle={isDeptHead && !isAdmin ? 'Courses in your department' : 'Manage academic courses'}
        action={isAdmin ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Course</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={isAdmin ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className={`icon-btn ${item.status === 'ACTIVE' ? 'icon-btn-warn' : 'icon-btn-success'}`} onClick={() => handleToggle(item)} title="Toggle status">
              {item.status === 'ACTIVE' ? <BsToggleOn size={15} /> : <BsToggleOff size={15} />}
            </button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Course' : 'New Course'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Title</label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Course title" />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Department</label>
            <select className="form-select" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
              <option value="">Select department</option>
              {data.departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Credits</label>
              <input type="number" className="form-control" value={form.credits} onChange={e => setForm(f => ({ ...f, credits: Number(e.target.value) }))} min={1} />
            </div>
            <div>
              <label className="form-label">Duration (semesters)</label>
              <input type="number" className="form-control" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} min={1} />
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

      <DeleteModal show={modal === 'delete'} label={selected?.title} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default CoursePage;
