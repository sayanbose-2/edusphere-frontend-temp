import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsToggleOn, BsToggleOff } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { departmentService } from '@/services/department.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Column } from '@/components/ui/DataTable';
import type { Course, Department, CreateCourseRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function CourseCRUD() {
  const [items, setItems] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [credits, setCredits] = useState(3);
  const [duration, setDuration] = useState(1);

  const load = async () => {
    try {
      setLoading(true);
      const [c, d] = await Promise.all([courseService.getAll(), departmentService.getAll()]);
      setItems(c); setDepartments(d);
    } catch { toast.error('Failed to load courses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setTitle(''); setDepartmentId(''); setCredits(3); setDuration(1); setModal('create'); };
  const openEdit = (item: Course) => { setSelected(item); setTitle(item.title); setDepartmentId(item.departmentId); setCredits(item.credits); setDuration(item.duration); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateCourseRequest = { title, departmentId, credits, duration, status: Status.ACTIVE };
      if (modal === 'edit' && selected) { await courseService.update(selected.id, payload); toast.success('Course updated'); }
      else { await courseService.create(payload); toast.success('Course created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save course'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (item: Course) => {
    try {
      await courseService.updateStatus(item.id, (item.status === 'ACTIVE' ? Status.INACTIVE : Status.ACTIVE));
      toast.success('Status updated'); load();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await courseService.delete(selected.id); toast.success('Course deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete course'); }
    finally { setSaving(false); }
  };

  const deptName = (id: string) => departments.find(d => d.id === id)?.departmentName ?? '—';

  const columns: Column<Course>[] = [
    { key: 'title',        label: 'Title' },
    { key: 'departmentId', label: 'Department', render: item => deptName(item.departmentId) },
    { key: 'credits',      label: 'Credits' },
    { key: 'duration',     label: 'Duration (sem)' },
    { key: 'status',       label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Courses" subtitle="Manage academic courses"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Course</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className={`icon-btn ${item.status === 'ACTIVE' ? 'icon-btn-warn' : 'icon-btn-success'}`} onClick={() => handleToggle(item)} title="Toggle status">
              {item.status === 'ACTIVE' ? <BsToggleOn size={15} /> : <BsToggleOff size={15} />}
            </button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Course' : 'New Course'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Course title" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Department</label>
            <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Credits</label>
              <input type="number" className="form-control" value={credits} onChange={e => setCredits(Number(e.target.value))} min={1} />
            </div>
            <div>
              <label className="form-label">Duration (semesters)</label>
              <input type="number" className="form-control" value={duration} onChange={e => setDuration(Number(e.target.value))} min={1} />
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

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete "{selected?.title}"?</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
