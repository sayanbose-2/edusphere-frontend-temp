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
import { BsCheckCircle } from 'react-icons/bs';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Exam, Course, CreateExamRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | 'complete' | null;

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
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load exams');
    }
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

  const handleMarkComplete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await examService.update(selected.id, {
        courseId: selected.courseId,
        type: selected.type,
        date: selected.date,
        status: Status.COMPLETED,
      });
      toast.success('Exam marked as completed. Grades can now be submitted.');
      setModal(null); load();
    } catch { toast.error('Failed to mark exam as completed'); }
    finally { setSaving(false); }
  };

  const courseName = (id: string) => courses.find(c => c.id === id)?.title ?? '—';
  const today = new Date().toISOString().split('T')[0];
  const isPastExam = (item: Exam) => new Date(item.date) < new Date();

  const columns: Column<Exam>[] = [
    { key: 'courseId', label: 'Exam', render: item => (
      <span>
        <span className="font-medium">{courseName(item.courseId)}</span>
        <span className="mx-1.5 text-tertiary">·</span>
        <StatusBadge status={item.type} />
      </span>
    )},
    { key: 'date',   label: 'Exam Date', render: item => new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Exams" subtitle="Manage examinations and assessments"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Exam</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            {item.status === Status.ACTIVE && isPastExam(item) && (
              <button
                className="icon-btn icon-btn-success"
                onClick={() => { setSelected(item); setModal('complete'); }}
                title="Mark as Completed"
              >
                <BsCheckCircle size={14} />
              </button>
            )}
            {item.status !== Status.COMPLETED && (
              <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            )}
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Exam' : 'New Exam'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as ExamType)}>
                {Object.values(ExamType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Exam Date</label>
              <input
                type="date"
                className="form-control"
                value={date}
                min={modal === 'create' ? today : undefined}
                onChange={e => setDate(e.target.value)}
              />
              {modal === 'create' && (
                <small className="text-xs text-tertiary">Must be today or a future date</small>
              )}
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

      {/* Mark Complete Confirmation */}
      <Modal show={modal === 'complete'} onHide={() => setModal(null)} size="sm" centered>
        <Modal.Body className="p-7 text-center">
          <BsCheckCircle size={32} className="text-success mb-3 mx-auto" />
          <p className="font-semibold mb-1.5">Mark exam as completed?</p>
          <p className="text-base text-secondary mb-1">
            {courseName(selected?.courseId || '')} — {selected && formatEnum(selected.type)}
          </p>
          <p className="text-sm text-tertiary mb-6">
            Grades can be submitted once the exam is marked completed.
          </p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-success btn-sm" onClick={handleMarkComplete} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}Mark Completed
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="p-7 text-center">
          <p className="font-semibold mb-1.5">Delete this exam?</p>
          <p className="text-xs text-secondary mb-6">This cannot be undone.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
