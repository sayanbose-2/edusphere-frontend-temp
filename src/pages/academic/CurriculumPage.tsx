import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDashCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import DeleteModal from '@/components/common/DeleteModal';
import { Role, Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { ICurriculum, ICourse, IDepartment, IPageResponse, ICreateCurriculumRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;
interface IModuleEntry { title: string; description: string; topics: string; }

const emptyMod = (): IModuleEntry => ({ title: '', description: '', topics: '' });

const parseMods = (json: unknown): IModuleEntry[] => {
  try {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (!Array.isArray(p) || !p.length) return [emptyMod()];
    return p.map((m: Record<string, unknown>) => ({
      title: String(m.title || ''),
      description: String(m.description || ''),
      topics: Array.isArray(m.topics) ? (m.topics as string[]).join(', ') : String(m.topics || ''),
    }));
  } catch { return [emptyMod()]; }
};

const serializeMods = (mods: IModuleEntry[]) =>
  JSON.stringify(mods.filter(m => m.title.trim()).map(m => ({
    title: m.title.trim(),
    description: m.description.trim(),
    topics: m.topics.split(',').map(t => t.trim()).filter(Boolean),
  })));

const countMods = (json: unknown): string => {
  try {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    const n = Array.isArray(p) ? p.length : 0;
    return `${n} module${n !== 1 ? 's' : ''}`;
  } catch { return '—'; }
};

const EMPTY_FORM = { courseId: '', description: '', status: Status.ACTIVE as Status, modules: [emptyMod()] };
const EMPTY_DATA = { items: [] as ICurriculum[], courses: [] as ICourse[] };

const CurriculumPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<ICurriculum | null>(null);
  const [saving, setSaving] = useState(false);

  const getCourses = (r: unknown) => {
    const d = (r as { data: IPageResponse<ICourse> | ICourse[] }).data;
    return Array.isArray(d) ? d : (d.content ?? []);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [cur, allCourses] = await Promise.all([
        apiClient.get<IPageResponse<ICurriculum>>('/curriculums').then(r => r.data.content ?? []),
        apiClient.get('/courses').then(getCourses),
      ]);

      if (isDeptHead && !isAdmin) {
        // dept head only sees curriculum for their dept courses
        const depts = await apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []);
        const myDept = depts.find(d => d.headId === user?.id);
        const deptCourseIds = new Set(allCourses.filter((c: ICourse) => c.departmentId === myDept?.id).map((c: ICourse) => c.id));
        setData({ courses: allCourses.filter((c: ICourse) => deptCourseIds.has(c.id)), items: cur.filter(c => deptCourseIds.has(c.courseId)) });
      } else {
        setData({ courses: allCourses, items: cur });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load curricula');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item: ICurriculum) => { setSelected(item); setForm({ courseId: item.courseId, description: item.description, status: item.status, modules: parseMods(item.modulesJSON) }); setModal('edit'); };

  const updMod = (i: number, f: keyof IModuleEntry, v: string) =>
    setForm(prev => ({ ...prev, modules: prev.modules.map((m, idx) => idx === i ? { ...m, [f]: v } : m) }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ICreateCurriculumRequest = { courseId: form.courseId, description: form.description, modulesJSON: serializeMods(form.modules), status: form.status };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/curriculums/${selected.id}`, payload);
        toast.success('Curriculum updated');
      } else {
        await apiClient.post('/curriculums', payload);
        toast.success('Curriculum created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save curriculum'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/curriculums/${selected.id}`);
      toast.success('Curriculum deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete curriculum'); } finally { setSaving(false); }
  };

  const courseName = (id: string) => data.courses.find(c => c.id === id)?.title ?? '—';

  const columns: Column<ICurriculum>[] = [
    { key: 'courseId',    label: 'Course',      render: item => courseName(item.courseId) },
    { key: 'description', label: 'Description', render: item => item.description.length > 60 ? item.description.slice(0, 60) + '…' : item.description },
    { key: 'modulesJSON', label: 'Modules',     render: item => countMods(item.modulesJSON) },
  ];

  return (
    <>
      <PageHeader
        title="Curricula"
        subtitle={isDeptHead && !isAdmin ? 'Curricula for your department courses' : 'Manage course curricula and modules'}
        action={isAdmin ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Curriculum</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={isAdmin ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Curriculum' : 'New Curriculum'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Course</label>
              <select className="form-select" value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}>
                <option value="">Select course</option>
                {data.courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                {Object.values(Status).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4.5">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Overall curriculum description" />
          </div>

          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold">Modules</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setForm(f => ({ ...f, modules: [...f.modules, emptyMod()] }))}>
              <BsPlus className="me-1" />Add Module
            </button>
          </div>

          {form.modules.map((mod, i) => (
            <div key={i} className="border border-light rounded-lg p-3.5 mb-3 bg-base">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Module {i + 1}</span>
                <button className="icon-btn icon-btn-danger" onClick={() => setForm(f => ({ ...f, modules: f.modules.length > 1 ? f.modules.filter((_, idx) => idx !== i) : f.modules }))} disabled={form.modules.length === 1}>
                  <BsDashCircle size={13} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <div>
                  <label className="form-label">Title</label>
                  <input className="form-control" value={mod.title} onChange={e => updMod(i, 'title', e.target.value)} placeholder="Module title" />
                </div>
                <div>
                  <label className="form-label">Topics (comma-separated)</label>
                  <input className="form-control" value={mod.topics} onChange={e => updMod(i, 'topics', e.target.value)} placeholder="Topic 1, Topic 2" />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <input className="form-control" value={mod.description} onChange={e => updMod(i, 'description', e.target.value)} placeholder="Brief description" />
              </div>
            </div>
          ))}
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

export default CurriculumPage;
