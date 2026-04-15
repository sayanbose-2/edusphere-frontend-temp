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
import { GradeStatus, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Grade, CreateGradeRequest, Exam, Student, Course } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

function calcGrade(score: number): { letter: string; status: GradeStatus } {
  if (score >= 90) return { letter: 'A', status: GradeStatus.PASS };
  if (score >= 80) return { letter: 'B', status: GradeStatus.PASS };
  if (score >= 70) return { letter: 'C', status: GradeStatus.PASS };
  if (score >= 60) return { letter: 'D', status: GradeStatus.PASS };
  return { letter: 'F', status: GradeStatus.FAIL };
}

export default function GradeList() {
  const [items, setItems] = useState<Grade[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [completedExams, setCompletedExams] = useState<Exam[]>([]);
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
      const [g, allE, compE, s, c] = await Promise.all([
        gradeService.getAll(),
        examService.getAll(),
        examService.getByStatus(Status.COMPLETED),
        studentService.getAll(),
        courseService.getAll(),
      ]);
      setItems(g); setAllExams(allE); setCompletedExams(compE); setStudents(s); setCourses(c);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load grades');
    }
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

  const openCreate = () => {
    setSelected(null); setExamId(''); setStudentId(''); setScore(0); setGrade(''); setGradeStatus(GradeStatus.PENDING);
    setModal('create');
  };
  const openEdit = (item: Grade) => {
    setSelected(item); setExamId(item.examId); setStudentId(item.studentId);
    setScore(item.score); setGrade(item.grade); setGradeStatus(item.status);
    setModal('edit');
  };

  const onScoreChange = (val: number) => {
    setScore(val);
    const calc = calcGrade(val);
    setGrade(calc.letter);
    setGradeStatus(calc.status);
  };

  const handleSave = async () => {
    if (!examId) { toast.error('Please select an exam'); return; }
    if (!studentId) { toast.error('Please select a student'); return; }
    setSaving(true);
    try {
      const payload: CreateGradeRequest = { examId, studentId, score, grade, status: gradeStatus };
      if (modal === 'edit' && selected) { await gradeService.update(selected.id!, payload); toast.success('Grade updated'); }
      else { await gradeService.create(payload); toast.success('Grade created'); }
      setModal(null); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string } })?.response?.data;
      toast.error(msg || 'Failed to save grade');
    }
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
  const examLabel = (id: string) => { const e = allExams.find(x => x.id === id); return e ? `${courseName(e.courseId)} — ${formatEnum(e.type)}` : '—'; };
  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? '—';

  const columns: Column<Grade>[] = [
    { key: 'examId',    label: 'Exam',    render: item => examLabel(item.examId) },
    { key: 'studentId', label: 'Student', render: item => studentName(item.studentId) },
    { key: 'score',     label: 'Score',   render: item => `${item.score}/100` },
    { key: 'grade',     label: 'Grade',   render: item => <strong className="text-base">{item.grade}</strong> },
    { key: 'status',    label: 'Status',  render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Grades" subtitle="View and manage student grades"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Grade</button>}
      />

      <div className="flex gap-3.5 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="form-label m-0 whitespace-nowrap">Student</label>
          <select className="form-select form-select-sm min-w-40" value={filterStudentId}
            onChange={e => { setFilterStudentId(e.target.value); setFilterExamId(''); filterByStudent(e.target.value); }}>
            <option value="">All students</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="form-label m-0 whitespace-nowrap">Exam</label>
          <select className="form-select form-select-sm min-w-52" value={filterExamId}
            onChange={e => { setFilterExamId(e.target.value); setFilterStudentId(''); filterByExam(e.target.value); }}>
            <option value="">All exams</option>
            {allExams.map(e => <option key={e.id} value={e.id}>{courseName(e.courseId)} — {formatEnum(e.type)}</option>)}
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Grade' : 'Add Grade'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Exam <span className="text-xs text-tertiary">(completed exams only)</span></label>
            <select className="form-select" value={examId} onChange={e => setExamId(e.target.value)}>
              <option value="">Select completed exam</option>
              {completedExams.map(e => (
                <option key={e.id} value={e.id}>
                  {courseName(e.courseId)} — {formatEnum(e.type)} ({new Date(e.date).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label className="form-label">Student</label>
            <select className="form-select" value={studentId} onChange={e => setStudentId(e.target.value)}>
              <option value="">Select student</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="form-label">Score <span className="text-xs text-tertiary">(0–100)</span></label>
              <input type="number" className="form-control" value={score} onChange={e => onScoreChange(Number(e.target.value))} min={0} max={100} />
            </div>
            <div>
              <label className="form-label">Grade Letter</label>
              <select className="form-select" value={grade} onChange={e => setGrade(e.target.value)}>
                <option value="">Select</option>
                {['A', 'B', 'C', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={gradeStatus} onChange={e => setGradeStatus(e.target.value as GradeStatus)}>
                {Object.values(GradeStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
          </div>
          <small className="text-xs text-tertiary mt-1.5 block">
            Grade and status are auto-calculated from score. You can override manually.
          </small>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="py-7 text-center">
          <p className="font-semibold mb-1.5">Delete this grade record?</p>
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
