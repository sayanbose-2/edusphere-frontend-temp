import { DateInput } from '@/components/common/DateInput';
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsCheckCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { ExamType, Role, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IExam, ICourse, IDepartment, IPageResponse, ICreateExamRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | 'complete' | null;

const EMPTY_FORM = { courseId: '', type: ExamType.MIDTERM, date: '' };
const EMPTY_DATA = { items: [] as IExam[], courses: [] as ICourse[] };

const ExamPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IExam | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isDeptHead) {
        const [allCourses, depts, allExams] = await Promise.all([
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])),
          apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IExam>>('/exams').then(r => r.data.content ?? []),
        ]);
        const myDept = depts.find(d => d.headId === user?.id);
        const deptCourseIds = new Set(allCourses.filter(c => c.departmentId === myDept?.id).map(c => c.id));
        setData({ courses: allCourses.filter(c => deptCourseIds.has(c.id)), items: allExams.filter(e => deptCourseIds.has(e.courseId)) });
      } else {
        const [e, c] = await Promise.all([
          apiClient.get<IPageResponse<IExam>>('/exams').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<ICourse>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])),
        ]);
        setData({ items: e, courses: c });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load exams');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item: IExam) => { setSelected(item); setForm({ courseId: item.courseId, type: item.type, date: item.date }); setModal('edit'); };

  const handleSave = async () => {
    if (!form.courseId) { toast.error('Please select a course'); return; }
    if (!form.date) { toast.error('Please select an exam date'); return; }
    setSaving(true);
    try {
      const payload: ICreateExamRequest = { courseId: form.courseId, type: form.type, date: form.date, status: Status.ACTIVE };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/exams/${selected.id}`, payload);
        toast.success('Exam updated');
      } else {
        await apiClient.post('/exams', payload);
        toast.success('Exam created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save exam'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/exams/${selected.id}`);
      toast.success('Exam deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete exam'); } finally { setSaving(false); }
  };

  const handleMarkComplete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.put(`/exams/${selected.id}`, { courseId: selected.courseId, type: selected.type, date: selected.date, status: Status.COMPLETED });
      toast.success('Exam marked as completed. Grades can now be submitted.');
      setModal(null); load();
    } catch { toast.error('Failed to mark exam as completed'); } finally { setSaving(false); }
  };

  const courseName = (id: string) => data.courses.find(c => c.id === id)?.title ?? '—';
  const today = new Date().toISOString().split('T')[0];
  const isPastExam = (item: IExam) => new Date(item.date) < new Date();

  const columns: Column<IExam>[] = [
    { key: 'courseId', label: 'Exam', render: item => (
      <span>
        <span className="font-medium">{courseName(item.courseId)}</span>
        <span className="mx-1.5 text-tertiary">·</span>
        <StatusBadge status={item.type} />
      </span>
    )},
    { key: 'date',   label: 'Date',   render: item => new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Exams"
        subtitle={isDeptHead ? 'Exams for your department courses' : 'Manage examinations and assessments'}
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Exam</button>}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
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
            {isAdmin && (
              <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
            )}
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Exam' : 'New Exam'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Course</label>
            <select className="form-select" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
              <option value="">Select course</option>
              {data.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Type</label>
              <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ExamType }))}>
                {Object.values(ExamType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date</label>
              <DateInput value={form.date} onChange={v => setForm(f => ({ ...f, date: v }))} min={modal === 'create' ? today : undefined} />
              {modal === 'create' && <small className="text-xs text-tertiary">Must be today or a future date</small>}
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

      <Modal show={modal === 'complete'} onHide={() => setModal(null)} size="sm" centered>
        <Modal.Body className="p-7 text-center">
          <BsCheckCircle size={32} className="text-success mb-3 mx-auto" />
          <p className="font-semibold mb-1.5">Mark exam as completed?</p>
          <p className="text-base text-secondary mb-1">{courseName(selected?.courseId || '')} — {selected && formatEnum(selected.type)}</p>
          <p className="text-sm text-tertiary mb-6">Grades can be submitted once the exam is marked completed.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-success btn-sm" onClick={handleMarkComplete} disabled={saving}>
              {saving && <span className="spinner-border spinner-border-sm me-2" />}Mark Completed
            </button>
          </div>
        </Modal.Body>
      </Modal>

      <DeleteModal show={modal === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default ExamPage;
