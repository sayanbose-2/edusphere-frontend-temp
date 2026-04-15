import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDashCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { curriculumService } from '@/services/curriculum.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Status } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Curriculum, Course, CreateCurriculumRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;
interface ModuleEntry { title: string; description: string; topics: string; }
const emptyMod = (): ModuleEntry => ({ title: '', description: '', topics: '' });

const parseMods = (json: unknown): ModuleEntry[] => {
  try {
    const p = typeof json === 'string' ? JSON.parse(json) : json;
    if (!Array.isArray(p) || !p.length) return [emptyMod()];
    return p.map((m: Record<string, unknown>) => ({ title: String(m.title || ''), description: String(m.description || ''), topics: Array.isArray(m.topics) ? (m.topics as string[]).join(', ') : String(m.topics || '') }));
  } catch { return [emptyMod()]; }
};

const serializeMods = (mods: ModuleEntry[]) =>
  JSON.stringify(mods.filter(m => m.title.trim()).map(m => ({ title: m.title.trim(), description: m.description.trim(), topics: m.topics.split(',').map(t => t.trim()).filter(Boolean) })));

const countMods = (json: unknown): string => {
  try { const p = typeof json === 'string' ? JSON.parse(json) : json; const n = Array.isArray(p) ? p.length : 0; return `${n} module${n !== 1 ? 's' : ''}`; } catch { return '—'; }
};

export default function CurriculumCRUD() {
  const [items, setItems] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Curriculum | null>(null);
  const [saving, setSaving] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>(Status.ACTIVE);
  const [modules, setModules] = useState<ModuleEntry[]>([emptyMod()]);

  const load = async () => {
    try {
      setLoading(true);
      const [cur, crs] = await Promise.all([curriculumService.getAll(), courseService.getAll()]);
      setItems(cur); setCourses(crs);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load curricula');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setCourseId(''); setDescription(''); setStatus(Status.ACTIVE); setModules([emptyMod()]); setModal('create'); };
  const openEdit = (item: Curriculum) => { setSelected(item); setCourseId(item.courseId); setDescription(item.description); setStatus(item.status); setModules(parseMods(item.modulesJSON)); setModal('edit'); };
  const updMod = (i: number, f: keyof ModuleEntry, v: string) => setModules(prev => prev.map((m, idx) => idx === i ? { ...m, [f]: v } : m));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateCurriculumRequest = { courseId, description, modulesJSON: serializeMods(modules), status };
      if (modal === 'edit' && selected) { await curriculumService.update(selected.id, payload); toast.success('Curriculum updated'); }
      else { await curriculumService.create(payload); toast.success('Curriculum created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save curriculum'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await curriculumService.delete(selected.id); toast.success('Curriculum deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete curriculum'); }
    finally { setSaving(false); }
  };

  const courseName = (id: string) => courses.find(c => c.id === id)?.title ?? '—';

  const columns: Column<Curriculum>[] = [
    { key: 'courseId',     label: 'Course',      render: item => courseName(item.courseId) },
    { key: 'description',  label: 'Description', render: item => item.description.length > 60 ? item.description.slice(0, 60) + '…' : item.description },
    { key: 'modulesJSON',  label: 'Modules',     render: item => countMods(item.modulesJSON) },
  ];

  return (
    <>
      <PageHeader title="Curricula" subtitle="Manage course curricula and modules"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Curriculum</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Curriculum' : 'New Curriculum'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
                {Object.values(Status).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4.5">
            <label className="form-label">Description</label>
            <textarea className="form-control" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Overall curriculum description" />
          </div>

          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-semibold text-base">Modules</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setModules(p => [...p, emptyMod()])}><BsPlus className="me-1" />Add Module</button>
          </div>

          {modules.map((mod, i) => (
            <div key={i} className="border border-light rounded-lg p-3.5 mb-3 bg-base">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-xs font-bold text-tertiary uppercase tracking-wider">Module {i + 1}</span>
                <button className="icon-btn icon-btn-danger" onClick={() => setModules(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} disabled={modules.length === 1}><BsDashCircle size={13} /></button>
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

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="p-7 text-center">
          <p className="font-semibold mb-1.5">Delete this curriculum?</p>
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
