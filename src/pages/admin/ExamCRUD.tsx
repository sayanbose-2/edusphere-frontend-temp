import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExamType, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Exam, Course, CreateExamRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function ExamCRUD() {
  const [items, setItems] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<ExamType>(ExamType.MIDTERM);
  const [date, setDate] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [e, c] = await Promise.all([examService.getAll(), courseService.getAll()]);
      setItems(e); setCourses(c);
    } catch { toast.error('Failed to load exams'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setCourseId(''); setType(ExamType.MIDTERM); setDate(''); setModal('create'); };
  const openEdit = (item: Exam) => { setSelected(item); setCourseId(item.courseId); setType(item.type); setDate(item.date); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateExamRequest = { courseId, type, date, status: Status.ACTIVE };
      if (modal === 'edit' && selected) { await examService.update(selected.id, payload); toast.success('Exam updated'); }
      else { await examService.create(payload); toast.success('Exam created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save exam'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await examService.delete(selected.id); toast.success('Exam deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete exam'); }
    finally { setSaving(false); }
  };

  const courseName = (id: string) => courses.find(c => c.id === id)?.title ?? '—';

  const columns: Column<Exam>[] = [
    { key: 'courseId', label: 'Course', render: item => courseName(item.courseId) },
    { key: 'type',     label: 'Type',   render: item => <StatusBadge status={item.type} /> },
    { key: 'date',     label: 'Date',   render: item => new Date(item.date).toLocaleDateString() },
    { key: 'status',   label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Exams" subtitle="Manage examinations and assessments"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Exam</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Exam' : 'New Exam'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as ExamType)}>
                {Object.values(ExamType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} />
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
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete this exam?</p>
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
