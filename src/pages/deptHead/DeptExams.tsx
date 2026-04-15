import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsPlus, BsCheckCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { departmentService } from '@/services/department.service';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExamType, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Exam, Course, CreateExamRequest, Department } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'complete' | null;

export default function DeptExams() {
  const { user } = useAuth();
  const [items, setItems] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [myDept, setMyDept] = useState<Department | null>(null);
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
      const [allExams, allCourses, allDepts] = await Promise.all([
        examService.getAll(),
        courseService.getAll(),
        departmentService.getAll(),
      ]);
      const dept = allDepts.find((d: Department) => d.headId === user?.id) || null;
      setMyDept(dept);
      const deptCourseIds = new Set(
        allCourses.filter((c: Course) => c.departmentId === dept?.id).map((c: Course) => c.id)
      );
      setCourses(allCourses.filter((c: Course) => c.departmentId === dept?.id));
      setItems(allExams.filter((e: Exam) => deptCourseIds.has(e.courseId)));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load exams');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const today = new Date().toISOString().split('T')[0];
  const isPastExam = (item: Exam) => new Date(item.date) < new Date();

  const openCreate = () => {
    setSelected(null); setCourseId(''); setType(ExamType.MIDTERM); setDate('');
    setModal('create');
  };
  const openEdit = (item: Exam) => {
    setSelected(item); setCourseId(item.courseId); setType(item.type); setDate(item.date);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!courseId) { toast.error('Please select a course'); return; }
    if (!date) { toast.error('Please select an exam date'); return; }
    setSaving(true);
    try {
      const payload: CreateExamRequest = { courseId, type, date, status: Status.ACTIVE };
      if (modal === 'edit' && selected) { await examService.update(selected.id, payload); toast.success('Exam updated'); }
      else { await examService.create(payload); toast.success('Exam created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save exam'); }
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

  const columns: Column<Exam>[] = [
    { key: 'courseId', label: 'Course', render: item => courseName(item.courseId) },
    { key: 'type',     label: 'Type',   render: item => <StatusBadge status={item.type} /> },
    { key: 'date',     label: 'Date',   render: item => new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'status',   label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Exams"
        subtitle={myDept ? `Exams in ${myDept.departmentName}` : 'Department exams'}
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Create Exam</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
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
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Exam' : 'Create Exam'}</Modal.Title></Modal.Header>
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
              <input
                type="date"
                className="form-control"
                value={date}
                min={modal === 'create' ? today : undefined}
                onChange={e => setDate(e.target.value)}
              />
              {modal === 'create' && (
                <small style={{ fontSize: 11, color: 'var(--text-3)' }}>Must be today or a future date</small>
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
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <BsCheckCircle size={32} style={{ color: 'var(--success)', marginBottom: 12 }} />
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Mark exam as completed?</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 4 }}>
            {courseName(selected?.courseId || '')} — {selected && formatEnum(selected.type)}
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 24 }}>
            Grades can be submitted and students can view results once completed.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-success btn-sm" onClick={handleMarkComplete} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}Mark Completed
            </button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
