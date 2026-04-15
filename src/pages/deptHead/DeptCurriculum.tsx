import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDashCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { curriculumService } from '@/services/curriculum.service';
import { departmentService } from '@/services/department.service';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Status } from '@/types/enums';
import type { Curriculum, Course, CreateCurriculumRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

interface ModuleEntry { title: string; description: string; topics: string; }
const emptyModule = (): ModuleEntry => ({ title: '', description: '', topics: '' });

const parseModules = (json: unknown): ModuleEntry[] => {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (!Array.isArray(parsed) || parsed.length === 0) return [emptyModule()];
    return parsed.map((m: Record<string, unknown>) => ({
      title: String(m.title || ''), description: String(m.description || ''),
      topics: Array.isArray(m.topics) ? m.topics.join(', ') : String(m.topics || ''),
    }));
  } catch { return [emptyModule()]; }
};

const serializeModules = (modules: ModuleEntry[]) =>
  JSON.stringify(modules.filter(m => m.title.trim()).map(m => ({
    title: m.title.trim(), description: m.description.trim(),
    topics: m.topics.split(',').map(t => t.trim()).filter(Boolean),
  })));

const countModules = (json: unknown): string => {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    const count = Array.isArray(parsed) ? parsed.length : 0;
    return `${count} module${count !== 1 ? 's' : ''}`;
  } catch { return '—'; }
};

export default function DeptCurriculum() {
  const { user } = useAuth();
  const [items, setItems] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Curriculum | null>(null);
  const [saving, setSaving] = useState(false);

  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<ModuleEntry[]>([emptyModule()]);

  const load = async () => {
    try {
      setLoading(true);
      const [allCurr, allCourses, allDepts] = await Promise.all([curriculumService.getAll(), courseService.getAll(), departmentService.getAll()]);
      const myDept = allDepts.find(d => d.headId === user?.id);
      const deptCourses = myDept ? allCourses.filter(c => c.departmentId === myDept.id) : allCourses;
      setCourses(deptCourses);
      const ids = new Set(deptCourses.map(c => c.id));
      setItems(myDept ? allCurr.filter(cur => ids.has(cur.courseId)) : allCurr);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load curriculums');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setCourseId(''); setDescription(''); setModules([emptyModule()]); setModal('create'); };
  const openEdit = (item: Curriculum) => { setSelected(item); setCourseId(item.courseId); setDescription(item.description); setModules(parseModules(item.modulesJSON)); setModal('edit'); };

  const updateModule = (i: number, field: keyof ModuleEntry, val: string) =>
    setModules(prev => prev.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateCurriculumRequest = { courseId, description, modulesJSON: serializeModules(modules), status: Status.ACTIVE };
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

  const columns: Column<Curriculum>[] = [
    { key: 'courseId',    label: 'Course',      render: item => courses.find(c => c.id === item.courseId)?.title || '—' },
    { key: 'description', label: 'Description' },
    { key: 'modulesJSON', label: 'Modules',     render: item => countModules(item.modulesJSON) },
  ];

  return (
    <>
      <PageHeader title="Curriculum" subtitle="Manage course curriculums"
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
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Curriculum' : 'Create Curriculum'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Name</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="mb-3.5">
            <label className="form-label">Description</label>
            <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Overall curriculum description" />
          </div>
          <div className="flex justify-between items-center mb-2.5">
            <label className="form-label mb-0 font-semibold">Modules</label>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModules(p => [...p, emptyModule()])}>
              <BsPlus className="me-1" />Add Module
            </button>
          </div>
          {modules.map((mod, i) => (
            <div key={i} className="border border-border rounded-lg p-4 mb-3 bg-surface">
              <div className="flex justify-between items-center mb-2.5">
                <span className="text-sm font-bold text-secondary uppercase tracking-widest">Module {i + 1}</span>
                <button type="button" className="icon-btn icon-btn-danger" onClick={() => setModules(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} disabled={modules.length === 1}><BsDashCircle size={13} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-2.5">
                <div>
                  <label className="form-label text-sm">Title</label>
                  <input className="form-control form-control-sm" value={mod.title} onChange={e => updateModule(i, 'title', e.target.value)} placeholder="e.g. Introduction" />
                </div>
                <div>
                  <label className="form-label text-sm">Topics <span className="text-secondary font-normal">(comma-separated)</span></label>
                  <input className="form-control form-control-sm" value={mod.topics} onChange={e => updateModule(i, 'topics', e.target.value)} placeholder="e.g. Variables, Loops" />
                </div>
              </div>
              <div>
                <label className="form-label text-sm">Description</label>
                <input className="form-control form-control-sm" value={mod.description} onChange={e => updateModule(i, 'description', e.target.value)} placeholder="Brief description" />
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
