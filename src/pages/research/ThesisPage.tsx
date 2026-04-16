import { DateInput } from '@/components/common/DateInput';
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
import { Role, ThesisStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IThesis, IStudent, IFaculty, IPageResponse, ICreateThesisRequest } from '@/types/academicTypes';

type TModalMode = 'form' | 'status' | 'delete' | null;

const EMPTY_FORM = { studentId: '', title: '', submissionDate: '', supervisorId: '', status: ThesisStatus.SUBMITTED };
const EMPTY_DATA = { items: [] as IThesis[], students: [] as IStudent[], faculties: [] as IFaculty[] };

const ThesisPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;
  const isStudent = user?.roles.includes(Role.STUDENT) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IThesis | null>(null);
  const [saving, setSaving] = useState(false);
  const [myStudentId, setMyStudentId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const [thesisData, me] = await Promise.all([
          apiClient.get<IPageResponse<IThesis>>('/theses/my').then(r => r.data.content ?? []),
          apiClient.get<{ id: string }>('/students/me').then(r => r.data),
        ]);
        setData(d => ({ ...d, items: thesisData }));
        setMyStudentId(me.id);
        try {
          // student role might not have full access to faculty list
          const f = await apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []);
          setData(d => ({ ...d, faculties: f }));
        } catch { /* no permission, names wont show */ }
      } else if (isFaculty) {
        // thesis supervision — only theses where this faculty is supervisor
        const [theses, stu] = await Promise.all([
          apiClient.get<IPageResponse<IThesis>>('/theses/my').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
        ]);
        setData(d => ({ ...d, items: theses, students: stu }));
      } else {
        // admin sees all
        const [t, s, f] = await Promise.all([
          apiClient.get<IPageResponse<IThesis>>('/theses').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []),
        ]);
        setData({ items: t, students: s, faculties: f });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load theses');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => {
    setSelected(null);
    setForm({ ...EMPTY_FORM, studentId: isStudent ? myStudentId : '', submissionDate: new Date().toISOString().split('T')[0] });
    setModal('form');
  };

  const openEdit = (item: IThesis) => {
    setSelected(item);
    setForm({ studentId: item.studentId, title: item.title, submissionDate: item.submissionDate, supervisorId: item.supervisorId, status: item.status });
    setModal(isFaculty ? 'status' : 'form');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ICreateThesisRequest = { studentId: form.studentId || myStudentId, title: form.title, supervisorId: form.supervisorId, submissionDate: form.submissionDate, status: form.status };
      if (selected) {
        await apiClient.put(`/theses/${selected.id}`, payload);
        toast.success(isFaculty ? 'Thesis status updated' : 'Thesis updated');
      } else {
        await apiClient.post('/theses', payload);
        toast.success(isStudent ? 'Thesis submitted' : 'Thesis created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save thesis'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/theses/${selected.id}`);
      toast.success('Thesis deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete thesis'); } finally { setSaving(false); }
  };

  const studentName = (id: string) => data.students.find(s => s.id === id)?.name ?? '—';
  const facultyName = (id: string) => data.faculties.find(f => f.id === id)?.name ?? '—';

  const columns: Column<IThesis>[] = [
    ...(!isStudent ? [{ key: 'studentId' as const, label: 'Student', render: (item: IThesis) => studentName(item.studentId) }] : []),
    { key: 'title', label: 'Title' },
    ...(!isFaculty ? [{ key: 'supervisorId' as const, label: 'Supervisor', render: (item: IThesis) => facultyName(item.supervisorId) }] : []),
    { key: 'submissionDate', label: 'Submitted', render: item => new Date(item.submissionDate).toLocaleDateString() },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title={isFaculty ? 'Thesis Supervision' : isStudent ? 'My Thesis' : 'Theses'}
        subtitle={isFaculty ? 'Manage theses you supervise' : isStudent ? 'View and submit your thesis' : 'Manage student thesis submissions'}
        action={(isAdmin || isStudent) ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}>
            <BsPlus className="me-1" />{isStudent ? 'Submit New Thesis' : 'Add Thesis'}
          </button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            {(isAdmin || isFaculty) && (
              <button className="icon-btn" onClick={() => openEdit(item)} disabled={!item.id} title={isFaculty ? 'Update status' : 'Edit'}><BsPencil size={13} /></button>
            )}
            {isAdmin && (
              <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} disabled={!item.id}><BsTrash size={13} /></button>
            )}
          </div>
        )}
      />

      {/* faculty status update modal — simpler */}
      <Modal show={modal === 'status'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Update Thesis Status</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="bg-surface border border-border rounded p-3.5 text-sm mb-4">
              <div className="font-semibold mb-1">{selected.title}</div>
              <div className="text-secondary">Student: {studentName(selected.studentId)}</div>
            </div>
          )}
          <label className="form-label">Status</label>
          <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ThesisStatus }))}>
            {Object.values(ThesisStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Update
          </button>
        </Modal.Footer>
      </Modal>

      {/* create / full edit modal */}
      <Modal show={modal === 'form'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selected ? 'Edit Thesis' : isStudent ? 'Submit New Thesis' : 'Add Thesis'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isStudent && (
            <div className="grid grid-cols-2 gap-3.5 mb-3.5">
              <div>
                <label className="form-label">Student</label>
                <select className="form-select" value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                  <option value="">Select student</option>
                  {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Supervisor</label>
                <select className="form-select" value={form.supervisorId} onChange={e => setForm(f => ({ ...f, supervisorId: e.target.value }))}>
                  <option value="">Select supervisor</option>
                  {data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div className="mb-3.5">
            <label className="form-label">Title</label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Thesis title" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Submission Date</label>
              <DateInput value={form.submissionDate} onChange={v => setForm(f => ({ ...f, submissionDate: v }))} />
            </div>
            {isStudent && (
              <div>
                <label className="form-label">Supervisor</label>
                <select className="form-select" value={form.supervisorId} onChange={e => setForm(f => ({ ...f, supervisorId: e.target.value }))}>
                  <option value="">Select supervisor</option>
                  {data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            {isAdmin && (
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ThesisStatus }))}>
                  {Object.values(ThesisStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </select>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}{isStudent ? 'Submit' : 'Save'}
          </button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default ThesisPage;
