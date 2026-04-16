import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { GradeStatus, Role, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IGrade, IExam, IStudent, ICourse, IDepartment, IPageResponse, ICreateGradeRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;

// A -> 90+, B -> 80+, C -> 70+, D -> 60+, F -> below 60
const calcGrade = (score: number) => {
  if (score >= 90) return { letter: 'A', status: GradeStatus.PASS };
  if (score >= 80) return { letter: 'B', status: GradeStatus.PASS };
  if (score >= 70) return { letter: 'C', status: GradeStatus.PASS };
  if (score >= 60) return { letter: 'D', status: GradeStatus.PASS };
  return { letter: 'F', status: GradeStatus.FAIL };
};

const EMPTY_FORM = { examId: '', studentId: '', score: 0, grade: '', gradeStatus: GradeStatus.PENDING };
const EMPTY_DATA = { items: [] as IGrade[], allExams: [] as IExam[], completedExams: [] as IExam[], students: [] as IStudent[], courses: [] as ICourse[] };

const GradePage = () => {
  const { user } = useAuth();

  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;
  const isStudent = user?.roles.includes(Role.STUDENT) ?? false;
  const canEdit = isAdmin || isDeptHead || isFaculty;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filters, setFilters] = useState({ studentId: '', examId: '' });
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IGrade | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const items = await apiClient.get<IPageResponse<IGrade>>('/grades/my').then(r => r.data.content ?? []);
        if (items.length > 0) {
          const uniqueExamIds = [...new Set(items.map(g => g.examId))];
          const allExams = await Promise.all(uniqueExamIds.map(id => apiClient.get<IExam>(`/exams/${id}`).then(r => r.data)));
          const uniqueCourseIds = [...new Set(allExams.map(e => e.courseId))];
          const courses = await Promise.all(uniqueCourseIds.map(id => apiClient.get<ICourse>(`/courses/${id}`).then(r => r.data)));
          setData(d => ({ ...d, items, allExams, courses }));
        } else {
          setData(d => ({ ...d, items }));
        }
      } else if (isDeptHead) {
        const [allCourses, depts] = await Promise.all([
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []),
        ]);
        const myDept = depts.find(d => d.headId === user?.id);
        const deptCourseIds = new Set(allCourses.filter(c => c.departmentId === myDept?.id).map(c => c.id));
        const courses = allCourses.filter(c => deptCourseIds.has(c.id));

        const [allExams, completedExams, students] = await Promise.all([
          apiClient.get<IPageResponse<IExam>>('/exams').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IExam>>(`/exams/status/${Status.COMPLETED}`).then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
        ]);
        const deptAllExams = allExams.filter(e => deptCourseIds.has(e.courseId));
        const deptCompExams = completedExams.filter(e => deptCourseIds.has(e.courseId));
        const items = deptCompExams.length > 0
          ? (await Promise.all(deptCompExams.map(e => apiClient.get<IPageResponse<IGrade>>(`/grades/exam/${e.id}`).then(r => r.data.content ?? [])))).flat()
          : [];
        setData({ items, allExams: deptAllExams, completedExams: deptCompExams, students, courses });
      } else if (isFaculty) {
        const [allCourses, allItems, completedExams, students] = await Promise.all([
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IGrade>>('/grades').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IExam>>(`/exams/status/${Status.COMPLETED}`).then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
        ]);
        try {
          const me = await apiClient.get<{ id: string; }>('/faculties/me').then(r => r.data);
          const workloads = await apiClient.get<IPageResponse<{ courseId: string; }> | { courseId: string; }[]>(`/workloads/faculty/${me.id}`)
            .then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? []));
          const assignedIds = new Set(workloads.map(w => w.courseId));
          if (assignedIds.size > 0) {
            const myCompExams = completedExams.filter(e => assignedIds.has(e.courseId));
            const myExamIds = new Set(myCompExams.map(e => e.id));
            setData({ items: allItems.filter(g => myExamIds.has(g.examId)), allExams: myCompExams, completedExams: myCompExams, students, courses: allCourses.filter(c => assignedIds.has(c.id)) });
          } else {
            setData({ items: allItems, allExams: completedExams, completedExams, students, courses: allCourses });
          }
        } catch {
          setData({ items: allItems, allExams: completedExams, completedExams, students, courses: allCourses });
        }
      } else if (isAdmin) {
        const [items, allExams, completedExams, students, courses] = await Promise.all([
          apiClient.get<IPageResponse<IGrade>>('/grades').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IExam>>('/exams').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IExam>>(`/exams/status/${Status.COMPLETED}`).then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])),
        ]);
        setData({ items, allExams, completedExams, students, courses });
      } else {
        // compliance officer / regulator — read-only, limited endpoint access
        const [items, allExams] = await Promise.all([
          apiClient.get<IPageResponse<IGrade>>('/grades').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IExam>>('/exams').then(r => r.data.content ?? []),
        ]);
        setData(d => ({ ...d, items, allExams, completedExams: allExams }));
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; }; })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const filterByStudent = async (sid: string) => {
    setFilters({ studentId: sid, examId: '' });
    if (!sid) { load(); return; }
    try {
      setLoading(true);
      setData(d => ({ ...d, items: [] }));
      const items = await apiClient.get<IPageResponse<IGrade>>(`/grades/students/${sid}`).then(r => r.data.content ?? []);
      setData(d => ({ ...d, items }));
    } catch { toast.error('Filter failed'); } finally { setLoading(false); }
  };

  const filterByExam = async (eid: string) => {
    setFilters({ examId: eid, studentId: '' });
    if (!eid) { load(); return; }
    try {
      setLoading(true);
      const items = await apiClient.get<IPageResponse<IGrade>>(`/grades/exam/${eid}`).then(r => r.data.content ?? []);
      setData(d => ({ ...d, items }));
    } catch { toast.error('Filter failed'); } finally { setLoading(false); }
  };

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item: IGrade) => {
    setSelected(item);
    setForm({ examId: item.examId, studentId: item.studentId, score: item.score, grade: item.grade, gradeStatus: item.status });
    setModal('edit');
  };

  const onScoreChange = (val: number) => {
    const calc = calcGrade(val);
    setForm(f => ({ ...f, score: val, grade: calc.letter, gradeStatus: calc.status }));
  };

  const handleSave = async () => {
    if (!form.examId) { toast.error('Please select an exam'); return; }
    if (!form.studentId) { toast.error('Please select a student'); return; }
    setSaving(true);
    try {
      const payload: ICreateGradeRequest = { examId: form.examId, studentId: form.studentId, score: form.score, grade: form.grade, status: form.gradeStatus };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/grades/${selected.id}`, payload);
        toast.success('Grade updated');
      } else {
        await apiClient.post('/grades', payload);
        toast.success('Grade submitted');
      }
      setModal(null); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: string; }; })?.response?.data;
      toast.error(msg || 'Failed to save grade');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/grades/${selected.id}`);
      toast.success('Grade deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete grade'); } finally { setSaving(false); }
  };

  const courseName = (id: string) => data.courses.find(c => c.id === id)?.title ?? '—';
  const examLabel = (id: string) => { const e = data.allExams.find(x => x.id === id); return e ? `${courseName(e.courseId)} — ${formatEnum(e.type)}` : '—'; };
  const studentName = (id: string) => data.students.find(s => s.id === id)?.name ?? '—';

  // ── Student view ─────────────────────────────────────────────────────────
  if (isStudent) {
    type TGradeRow = { grade: IGrade; exam: IExam | undefined; course: ICourse | undefined; };
    const examMap: Record<string, IExam> = Object.fromEntries(data.allExams.map(e => [e.id, e]));
    const courseMap: Record<string, ICourse> = Object.fromEntries(data.courses.map(c => [c.id, c]));

    const rows: TGradeRow[] = data.items.map(g => ({
      grade: g, exam: examMap[g.examId], course: examMap[g.examId] ? courseMap[examMap[g.examId].courseId] : undefined,
    }));

    const scores = rows.map(r => r.grade.score).filter(s => s > 0);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const passed = rows.filter(r => r.grade.status === 'PASS').length;
    const failed = rows.filter(r => r.grade.status === 'FAIL').length;

    const grouped: Record<string, TGradeRow[]> = {};
    rows.forEach(r => { const key = r.course?.id ?? 'unknown'; if (!grouped[key]) grouped[key] = []; grouped[key].push(r); });

    if (loading) return (
      <>
        <PageHeader title="My Grades" subtitle="View your exam results" />
        <div className="py-10 text-center"><span className="spinner-border spinner-border-sm me-2" />Loading grades…</div>
      </>
    );

    return (
      <>
        <PageHeader title="My Grades" subtitle="View your exam results by course" />
        {rows.length === 0 ? (
          <div className="py-8 text-center text-secondary">No grades available yet.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3.5 mb-6">
              <div className="card p-4"><div className="text-sm text-tertiary mb-1">Average Score</div><div className="text-7xl font-black text-blue">{avg ?? '—'}</div></div>
              <div className="card p-4"><div className="text-sm text-tertiary mb-1">Passed</div><div className="text-7xl font-black text-success">{passed}</div></div>
              <div className="card p-4"><div className="text-sm text-tertiary mb-1">Failed</div><div className="text-7xl font-black text-danger">{failed}</div></div>
            </div>
            {Object.values(grouped).map(courseRows => {
              const course = courseRows[0].course;
              return (
                <div key={course?.id ?? 'unknown'} className="card mb-5 p-0 overflow-hidden">
                  <div className="py-3 px-5 bg-base border-b border-border">
                    <span className="font-semibold text-lg">{course?.title ?? 'Unknown Course'}</span>
                    {course && <span className="text-sm text-tertiary ml-2.5">{course.credits} credits</span>}
                  </div>
                  <table className="w-full text-base">
                    <thead>
                      <tr>
                        <th className="py-2 px-5 text-left font-semibold text-secondary text-sm">Exam Type</th>
                        <th className="py-2 px-4 text-left font-semibold text-secondary text-sm">Date</th>
                        <th className="py-2 px-4 text-center font-semibold text-secondary text-sm">Score</th>
                        <th className="py-2 px-4 text-center font-semibold text-secondary text-sm">Grade</th>
                        <th className="py-2 px-4 text-left font-semibold text-secondary text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courseRows.map((r, i) => (
                        <tr key={r.grade.id ?? i} className="border-t border-border">
                          <td className="py-2.5 px-5"><StatusBadge status={r.exam?.type ?? '—'} /></td>
                          <td className="py-2.5 px-4 text-secondary">
                            {r.exam ? new Date(r.exam.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="font-semibold">{r.grade.score}</span><span className="text-tertiary text-xs">/100</span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className={`font-black text-lg ${r.grade.grade === 'F' ? 'text-danger' : r.grade.grade === 'A' ? 'text-success' : 'text-blue'}`}>
                              {r.grade.grade}
                            </span>
                          </td>
                          <td className="py-2.5 px-4"><StatusBadge status={r.grade.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </>
        )}
      </>
    );
  }

  // ── Staff view ────────────────────────────────────────────────────────────
  const columns: Column<IGrade>[] = [
    { key: 'examId', label: 'Exam', render: item => examLabel(item.examId) },
    { key: 'studentId', label: 'Student', render: item => studentName(item.studentId) },
    { key: 'score', label: 'Score', render: item => `${item.score}/100` },
    { key: 'grade', label: 'Grade', render: item => <strong className="text-base">{item.grade}</strong> },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Grades"
        subtitle={isDeptHead ? 'Grade results for your department' : isFaculty ? 'Submit and manage grades for your courses' : 'View and manage all student grades'}
        action={canEdit ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate} disabled={data.completedExams.length === 0}>
            <BsPlus className="me-1" />{isFaculty ? 'Submit Grade' : 'Add Grade'}
          </button>
        ) : undefined}
      />

      {isAdmin && (
        <div className="flex gap-3.5 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="form-label m-0 whitespace-nowrap">Student</label>
            <select className="form-select form-select-sm min-w-40" value={filters.studentId} onChange={e => filterByStudent(e.target.value)}>
              <option value="">All students</option>
              {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="form-label m-0 whitespace-nowrap">Exam</label>
            <select className="form-select form-select-sm min-w-52" value={filters.examId} onChange={e => filterByExam(e.target.value)}>
              <option value="">All exams</option>
              {data.allExams.map(e => <option key={e.id} value={e.id}>{courseName(e.courseId)} — {formatEnum(e.type)}</option>)}
            </select>
          </div>
        </div>
      )}

      {(isDeptHead || isFaculty) && data.allExams.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <label className="form-label m-0 whitespace-nowrap">Filter by Exam</label>
          <select className="form-select form-select-sm max-w-xs" value={filters.examId} onChange={e => filterByExam(e.target.value)}>
            <option value="">All exams</option>
            {data.allExams.map(e => <option key={e.id} value={e.id}>{courseName(e.courseId)} — {formatEnum(e.type)}</option>)}
          </select>
        </div>
      )}

      {data.completedExams.length === 0 && !loading && canEdit && (
        <div className="py-4 text-secondary text-sm">No completed exams yet. Mark an exam as completed before submitting grades.</div>
      )}

      <DataTable columns={columns} data={data.items} loading={loading}
        actions={canEdit ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id}><BsPencil size={13} /></button>
            {isAdmin && <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id}><BsTrash size={13} /></button>}
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Grade' : 'Submit Grade'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Exam <span className="text-xs text-tertiary">(completed exams only)</span></label>
            <select className="form-select" value={form.examId} onChange={e => setForm(f => ({ ...f, examId: e.target.value }))}>
              <option value="">Select completed exam</option>
              {data.completedExams.map(e => (
                <option key={e.id} value={e.id}>{courseName(e.courseId)} — {formatEnum(e.type)} ({new Date(e.date).toLocaleDateString()})</option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label className="form-label">Student</label>
            <select className="form-select" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
              <option value="">Select student</option>
              {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="form-label">Score <span className="text-xs text-tertiary">(0–100)</span></label>
              <input type="number" className="form-control" value={form.score} onChange={e => onScoreChange(Number(e.target.value))} min={0} max={100} />
            </div>
            <div>
              <label className="form-label">Grade Letter</label>
              <select className="form-select" value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
                <option value="">Select</option>
                {['A', 'B', 'C', 'D', 'F'].map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.gradeStatus} onChange={e => setForm(f => ({ ...f, gradeStatus: e.target.value as GradeStatus }))}>
                {Object.values(GradeStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
          </div>
          <small className="text-xs text-tertiary mt-1.5 block">Grade and status are auto-calculated from score. You can override manually.</small>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save
          </button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default GradePage;
