import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { studentService } from '@/services/student.service';
import { thesisService } from '@/services/thesis.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThesisStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Thesis, Student, Faculty, CreateThesisRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function ThesisCRUD() {
  const [items, setItems] = useState<Thesis[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Thesis | null>(null);
  const [saving, setSaving] = useState(false);

  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [status, setStatus] = useState<ThesisStatus>(ThesisStatus.IN_PROGRESS);

  const load = async () => {
    try {
      setLoading(true);
      const [t, s, f] = await Promise.all([thesisService.getAll(), studentService.getAll(), facultyService.getAll()]);
      setItems(t); setStudents(s); setFaculties(f);
    } catch { toast.error('Failed to load theses'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setStudentId(''); setTitle(''); setSubmissionDate(''); setSupervisorId(''); setStatus(ThesisStatus.IN_PROGRESS); setModal('create'); };
  const openEdit = (item: Thesis) => { setSelected(item); setStudentId(item.studentId); setTitle(item.title); setSubmissionDate(item.submissionDate); setSupervisorId(item.supervisorId); setStatus(item.status); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateThesisRequest = { studentId, title, submissionDate, supervisorId, status };
      if (modal === 'edit' && selected) { await thesisService.update(selected.id!, payload); toast.success('Thesis updated'); }
      else { await thesisService.create(payload); toast.success('Thesis created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save thesis'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await thesisService.delete(selected.id!); toast.success('Thesis deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete thesis'); }
    finally { setSaving(false); }
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? '—';
  const facultyName = (id: string) => faculties.find(f => f.id === id)?.name ?? '—';

  const columns: Column<Thesis>[] = [
    { key: 'studentId',      label: 'Student',    render: item => studentName(item.studentId) },
    { key: 'title',          label: 'Title' },
    { key: 'supervisorId',   label: 'Supervisor', render: item => facultyName(item.supervisorId) },
    { key: 'submissionDate', label: 'Submitted',  render: item => new Date(item.submissionDate).toLocaleDateString() },
    { key: 'status',         label: 'Status',     render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Theses" subtitle="Manage student thesis submissions"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Thesis</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Thesis' : 'Add Thesis'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Student</label>
              <select className="form-select" value={studentId} onChange={e => setStudentId(e.target.value)}>
                <option value="">Select student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Supervisor</label>
              <select className="form-select" value={supervisorId} onChange={e => setSupervisorId(e.target.value)}>
                <option value="">Select supervisor</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Thesis title" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Submission Date</label>
              <input type="date" className="form-control" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value as ThesisStatus)}>
                {Object.values(ThesisStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
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
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete this thesis?</p>
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
