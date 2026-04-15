import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsTrash, BsPlus, BsPersonPlus, BsMortarboard } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { researchService } from '@/services/research.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { ProjectStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { ResearchProject, Faculty, Student, CreateResearchProjectRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'delete' | 'addFaculty' | 'addStudent' | null;

export default function FacultyResearch() {
  const { user } = useAuth();
  const [items, setItems] = useState<ResearchProject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<ResearchProject | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE' as ProjectStatus);
  const [addId, setAddId] = useState('');

  const load = async () => {
    const [rpRes, facRes, stuRes] = await Promise.allSettled([researchService.getAll(), facultyService.getAll(), studentService.getAll()]);
    if (rpRes.status === 'fulfilled') setItems(rpRes.value);
    else {
      const status = (rpRes.reason as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load research projects');
    }
    if (facRes.status === 'fulfilled') setFaculties(facRes.value);
    if (stuRes.status === 'fulfilled') setStudents(stuRes.value);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setTitle(''); setStartDate(''); setEndDate(''); setStatus('ACTIVE' as ProjectStatus); setModal('create'); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: CreateResearchProjectRequest = { title, facultyId: user!.id, facultyMembers: [], students: [], startDate, endDate, status };
      await researchService.create(payload);
      toast.success('Project created'); setModal(null); load();
    } catch { toast.error('Failed to create project'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await researchService.delete(selected.id); toast.success('Project deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete project'); }
    finally { setSaving(false); }
  };

  const handleAddFaculty = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try { await researchService.addFaculty(selected.id, addId); toast.success('Co-investigator added'); setModal(null); load(); }
    catch { toast.error('Failed to add co-investigator'); }
    finally { setSaving(false); }
  };

  const handleAddStudent = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try { await researchService.addStudent(selected.id, addId); toast.success('Student added'); setModal(null); load(); }
    catch { toast.error('Failed to add student'); }
    finally { setSaving(false); }
  };

  const columns: Column<ResearchProject>[] = [
    { key: 'title',     label: 'Title' },
    { key: 'facultyId', label: 'Faculty Lead', render: item => faculties.find(f => f.id === item.facultyId)?.name ?? '—' },
    { key: 'startDate', label: 'Start' },
    { key: 'endDate',   label: 'End' },
    { key: 'status',    label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="My Research Projects" subtitle="Manage your research projects and participants"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />New Project</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn icon-btn-success" onClick={() => { setSelected(item); setAddId(''); setModal('addFaculty'); }} title="Add co-investigator"><BsPersonPlus size={13} /></button>
            <button className="icon-btn" onClick={() => { setSelected(item); setAddId(''); setModal('addStudent'); }} title="Add student"><BsMortarboard size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Create Research Project</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as ProjectStatus)}>
              {Object.values(ProjectStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Create
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'addFaculty'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Add Co-Investigator</Modal.Title></Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Project: <strong>{selected?.title}</strong></p>
          <label className="form-label">Select Faculty</label>
          <select className="form-select" value={addId} onChange={e => setAddId(e.target.value)}>
            <option value="">Select faculty member</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleAddFaculty} disabled={saving || !addId}>Add</button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'addStudent'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Add Student Participant</Modal.Title></Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Project: <strong>{selected?.title}</strong></p>
          <label className="form-label">Select Student</label>
          <select className="form-select" value={addId} onChange={e => setAddId(e.target.value)}>
            <option value="">Select student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleAddStudent} disabled={saving || !addId}>Add</button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete "{selected?.title}"?</p>
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
