import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { facultyService } from '@/services/faculty.service';
import { workloadService } from '@/services/workload.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Column } from '@/components/ui/DataTable';
import type { Workload, Faculty, Course, CreateWorkloadRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function WorkloadCRUD() {
  const [items, setItems] = useState<Workload[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Workload | null>(null);
  const [saving, setSaving] = useState(false);

  const [facultyId, setFacultyId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [hours, setHours] = useState(0);
  const [semester, setSemester] = useState('');
  const [status, setStatus] = useState<Status>(Status.ACTIVE);

  const load = async () => {
    try {
      setLoading(true);
      const [w, f, c] = await Promise.all([workloadService.getAll(), facultyService.getAll(), courseService.getAll()]);
      setItems(w); setFaculties(f); setCourses(c);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load workloads');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setFacultyId(''); setCourseId(''); setHours(0); setSemester(''); setStatus(Status.ACTIVE); setModal('create'); };
  const openEdit = (item: Workload) => { setSelected(item); setFacultyId(item.facultyId); setCourseId(item.courseId); setHours(item.hours); setSemester(item.semester); setStatus(item.status); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateWorkloadRequest = { facultyId, courseId, hours, semester, status };
      if (modal === 'edit' && selected) { await workloadService.update(selected.id!, payload); toast.success('Workload updated'); }
      else { await workloadService.create(payload); toast.success('Workload created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save workload'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await workloadService.delete(selected.id!); toast.success('Workload deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete workload'); }
    finally { setSaving(false); }
  };

  const facultyName = (id: string) => faculties.find(f => f.id === id)?.name ?? '—';
  const courseName  = (id: string) => courses.find(c => c.id === id)?.title ?? '—';

  const columns: Column<Workload>[] = [
    { key: 'facultyId', label: 'Faculty', render: item => facultyName(item.facultyId) },
    { key: 'courseId',  label: 'Course',  render: item => courseName(item.courseId) },
    { key: 'hours',     label: 'Hours' },
    { key: 'semester',  label: 'Semester' },
    { key: 'status',    label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Workloads" subtitle="Manage faculty teaching assignments"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Workload</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Workload' : 'Assign Workload'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Faculty</label>
            <select className="form-select" value={facultyId} onChange={e => setFacultyId(e.target.value)}>
              <option value="">Select faculty member</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Hours / Week</label>
              <input type="number" className="form-control" value={hours} onChange={e => setHours(Number(e.target.value))} min={0} />
            </div>
            <div>
              <label className="form-label">Semester</label>
              <input className="form-control" value={semester} onChange={e => setSemester(e.target.value)} placeholder="e.g. Fall 2025" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
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

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete this workload?</p>
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
