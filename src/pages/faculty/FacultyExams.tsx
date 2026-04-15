import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsCheckCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExamType, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Exam, Course, CreateExamRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | 'complete' | null;

export default function FacultyExams() {
  const [items, setItems] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [saving, setSaving] = useState(false);

  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<ExamType>(ExamType.MIDTERM);
  const [date, setDate] = useState('');

  const loadExams = () => {
    setLoading(true);
    examService.getAll()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadCourses = () => {
    courseService.getAll()
      .then(data => {
        setCourses(data);
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadExams();
    loadCourses();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const today = new Date().toISOString().split('T')[0];
  const isPastExam = (item: Exam) => new Date(item.date) < new Date();
  const courseName = (id: string) => courses.find(c => c.id === id)?.title ?? '—';

  const reload = () => {
    loadExams();
    loadCourses();
  };

  const openCreate = () => {
    setCourseId('');
    setType(ExamType.MIDTERM);
    setDate('');
    setSelected(null);
    loadCourses();
    setModal('create');
  };

  const openEdit = (item: Exam) => {
    setCourseId(item.courseId);
    setType(item.type);
    setDate(item.date);
    setSelected(item);
    loadCourses();
    setModal('edit');
  };

  const handleSave = async () => {
    if (!courseId) { toast.error('Please select a course'); return; }
    if (!date) { toast.error('Please select an exam date'); return; }
    setSaving(true);
    try {
      const payload: CreateExamRequest = { courseId, type, date, status: Status.ACTIVE };
      if (modal === 'edit' && selected) {
        await examService.update(selected.id, payload);
        toast.success('Exam updated');
      } else {
        await examService.create(payload);
        toast.success('Exam created');
      }
      setModal(null);
      reload();
    } catch {
      toast.error('Failed to save exam');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await examService.delete(selected.id);
      toast.success('Exam deleted');
      setModal(null);
      reload();
    } catch {
      toast.error('Failed to delete exam');
    } finally {
      setSaving(false);
    }
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
      setModal(null);
      reload();
    } catch {
      toast.error('Failed to mark exam as completed');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Exam>[] = [
    { key: 'courseId', label: 'Course',  render: item => courseName(item.courseId) },
    { key: 'type',     label: 'Type',    render: item => <StatusBadge status={item.type} /> },
    { key: 'date',     label: 'Date',    render: item => new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'status',   label: 'Status',  render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="My Exams"
        subtitle="Manage exams — mark as completed before submitting grades"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Create Exam</button>}
      />

      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            {item.status === Status.ACTIVE && isPastExam(item) && (
              <button className="icon-btn icon-btn-success" onClick={() => { setSelected(item); setModal('complete'); }} title="Mark as Completed">
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

      {/* Create / Edit Modal */}
      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{modal === 'edit' ? 'Edit Exam' : 'Create Exam'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">— select course —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            {courses.length === 0 && (
              <small className="text-danger text-sm">No courses available. Make sure courses are created first.</small>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={type} onChange={e => setType(e.target.value as ExamType)}>
                {Object.values(ExamType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
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
      <Modal show={modal === 'complete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="p-7 text-center">
          <BsCheckCircle size={32} className="text-success mb-3" />
          <p className="font-semibold mb-1.5">Mark exam as completed?</p>
          <p className="text-base text-secondary mb-1">
            {courseName(selected?.courseId || '')} — {selected && formatEnum(selected.type)}
          </p>
          <p className="text-sm text-tertiary mb-6">
            Once completed, grades can be submitted and students can view their results.
          </p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-success btn-sm" onClick={handleMarkComplete} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}Mark Completed
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation */}
      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="p-7 text-center">
          <p className="font-semibold mb-1.5">Delete this exam?</p>
          <p className="text-base text-secondary mb-6">This cannot be undone.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
