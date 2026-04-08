import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { gradeService } from '@/services/grade.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GradeStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Grade, CreateGradeRequest, Exam, Student, Course } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function GradeList() {
  const [items, setItems] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);

  const [examId, setExamId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [score, setScore] = useState(0);
  const [grade, setGrade] = useState('');
  const [gradeStatus, setGradeStatus] = useState<GradeStatus>(GradeStatus.PENDING);
  const [filterStudentId, setFilterStudentId] = useState('');
  const [filterExamId, setFilterExamId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [g, e, s, c] = await Promise.all([gradeService.getAll(), examService.getAll(), studentService.getAll(), courseService.getAll()]);
      setItems(g); setExams(e); setStudents(s); setCourses(c);
    } catch { toast.error('Failed to load grades'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const filterByStudent = async (sid: string) => {
    if (!sid) { load(); return; }
    try { setLoading(true); setItems(await gradeService.getByStudent(sid)); } catch { toast.error('Filter failed'); } finally { setLoading(false); }
  };

  const filterByExam = async (eid: string) => {
    if (!eid) { load(); return; }
    try { setLoading(true); setItems(await gradeService.getByExam(eid)); } catch { toast.error('Filter failed'); } finally { setLoading(false); }
  };

  const openCreate = () => { setSelected(null); setExamId(''); setStudentId(''); setScore(0); setGrade(''); setGradeStatus(GradeStatus.PENDING); setModal('create'); };
  const openEdit = (item: Grade) => { setSelected(item); setExamId(item.examId); setStudentId(item.studentId); setScore(item.score); setGrade(item.grade); setGradeStatus(item.status); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateGradeRequest = { examId, studentId, score, grade, status: gradeStatus };
      if (modal === 'edit' && selected) { await gradeService.update(selected.id!, payload); toast.success('Grade updated'); }
      else { await gradeService.create(payload); toast.success('Grade created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save grade'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await gradeService.delete(selected.id!); toast.success('Grade deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete grade'); }
    finally { setSaving(false); }
  };

  const courseName = (id: string) => courses.find(c => c.id === id)?.title ?? '—';
  const examLabel = (id: string) => { const e = exams.find(x => x.id === id); return e ? `${courseName(e.courseId)} — ${formatEnum(e.type)}` : '—'; };
  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? '—';

  const columns: Column<Grade>[] = [
    { key: 'examId',    label: 'Exam',    render: item => examLabel(item.examId) },
    { key: 'studentId', label: 'Student', render: item => studentName(item.studentId) },
    { key: 'score',     label: 'Score' },
    { key: 'grade',     label: 'Grade', render: item => <strong style={{ fontSize: 15 }}>{item.grade}</strong> },
    { key: 'status',    label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Grades" subtitle="View and manage student grades"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Grade</button>}
      />

      <div style={{ display: 'flex', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Student</label>
          <select className="form-select form-select-sm" style={{ minWidth: 160 }} value={filterStudentId}
            onChange={e => { setFilterStudentId(e.target.value); setFilterExamId(''); filterByStudent(e.target.value); }}>
            <option value="">All students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="form-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>Exam</label>
          <select className="form-select form-select-sm" style={{ minWidth: 200 }} value={filterExamId}
            onChange={e => { setFilterExamId(e.target.value); setFilterStudentId(''); filterByExam(e.target.value); }}>
            <option value="">All exams</option>
            {exams.map(e => <option key={e.id} value={e.id}>{courseName(e.courseId)} — {formatEnum(e.type)}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Grade' : 'Add Grade'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Exam</label>
            <select className="form-select" value={examId} onChange={e => setExamId(e.target.value)}>
              <option value="">Select exam</option>
              {exams.map(e => <option key={e.id} value={e.id}>{courseName(e.courseId)} — {formatEnum(e.type)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Student</label>
            <select className="form-select" value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Score</label>
              <input type="number" className="form-control" value={score} onChange={e => setScore(Number(e.target.value))} min={0} max={100} />
            </div>
            <div>
              <label className="form-label">Grade Letter</label>
              <input className="form-control" value={grade} onChange={e => setGrade(e.target.value)} placeholder="A, B, C…" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={gradeStatus} onChange={e => setGradeStatus(e.target.value as GradeStatus)}>
                {Object.values(GradeStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
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
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete this grade record?</p>
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
