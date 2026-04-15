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
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Curriculum' : 'Create Curriculum'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Course</label>
            <select className="form-select" value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">Select course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Description</label>
            <input className="form-control" value={description} onChange={e => setDescription(e.target.value)} placeholder="Overall curriculum description" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label className="form-label mb-0" style={{ fontWeight: 600 }}>Modules</label>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={() => setModules(p => [...p, emptyModule()])}>
              <BsPlus className="me-1" />Add Module
            </button>
          </div>
          {modules.map((mod, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 12, background: 'var(--surface)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Module {i + 1}</span>
                <button type="button" className="icon-btn icon-btn-danger" onClick={() => setModules(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p)} disabled={modules.length === 1}><BsDashCircle size={13} /></button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Title</label>
                  <input className="form-control form-control-sm" value={mod.title} onChange={e => updateModule(i, 'title', e.target.value)} placeholder="e.g. Introduction" />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: 12 }}>Topics <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(comma-separated)</span></label>
                  <input className="form-control form-control-sm" value={mod.topics} onChange={e => updateModule(i, 'topics', e.target.value)} placeholder="e.g. Variables, Loops" />
                </div>
              </div>
              <div>
                <label className="form-label" style={{ fontSize: 12 }}>Description</label>
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
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete this curriculum?</p>
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
