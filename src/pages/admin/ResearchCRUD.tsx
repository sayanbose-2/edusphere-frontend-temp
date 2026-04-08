import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsTrash, BsPlus, BsPersonPlus, BsMortarboard, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { researchService } from '@/services/research.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProjectStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { ResearchProject, Faculty, Student, CreateResearchProjectRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'delete' | 'manageFaculty' | 'manageStudent' | null;

export default function ResearchCRUD() {
  const [items, setItems] = useState<ResearchProject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<ResearchProject | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>(ProjectStatus.ACTIVE);
  const [addId, setAddId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [r, f, s] = await Promise.all([researchService.getAll(), facultyService.getAll(), studentService.getAll()]);
      setItems(r); setFaculties(f); setStudents(s);
    } catch { toast.error('Failed to load research projects'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setTitle(''); setFacultyId(''); setStartDate(''); setEndDate(''); setStatus(ProjectStatus.ACTIVE); setModal('create'); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: CreateResearchProjectRequest = { title, facultyId, facultyMembers: [], students: [], startDate, endDate, status };
      await researchService.create(payload);
      toast.success('Project created'); setModal(null); load();
    } catch { toast.error('Failed to create project'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await researchService.delete(selected.projectID); toast.success('Project deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete project'); }
    finally { setSaving(false); }
  };

  const handleAddFaculty = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try {
      await researchService.addFaculty(selected.projectID, addId);
      toast.success('Co-investigator added'); setAddId(''); load();
    } catch { toast.error('Failed to add co-investigator'); }
    finally { setSaving(false); }
  };

  const handleRemoveFaculty = async (fId: string) => {
    if (!selected) return;
    try {
      await researchService.removeFaculty(selected.projectID, fId);
      toast.success('Co-investigator removed'); load();
    } catch { toast.error('Failed to remove co-investigator'); }
  };

  const handleAddStudent = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try {
      await researchService.addStudent(selected.projectID, addId);
      toast.success('Student added'); setAddId(''); load();
    } catch { toast.error('Failed to add student'); }
    finally { setSaving(false); }
  };

  const handleRemoveStudent = async (sId: string) => {
    if (!selected) return;
    try {
      await researchService.removeStudent(selected.projectID, sId);
      toast.success('Student removed'); load();
    } catch { toast.error('Failed to remove student'); }
  };

  const facultyName = (id: string) => faculties.find(f => f.id === id)?.name ?? id.slice(0, 8) + '…';
  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? id.slice(0, 8) + '…';

  // Keep selected in sync after load (so manage modals reflect latest state)
  useEffect(() => {
    if (selected) setSelected(items.find(i => i.projectID === selected.projectID) ?? null);
  }, [items]);

  const columns: Column<ResearchProject>[] = [
    { key: 'title',     label: 'Title' },
    { key: 'facultyId', label: 'Lead Faculty', render: item => facultyName(item.facultyId) },
    { key: 'startDate', label: 'Start', render: item => new Date(item.startDate).toLocaleDateString() },
    { key: 'endDate',   label: 'End',   render: item => new Date(item.endDate).toLocaleDateString() },
    {
      key: 'facultyMembersIdList',
      label: 'Co-Investigators',
      render: item => item.facultyMembersIdList?.length
        ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {item.facultyMembersIdList.map(id => (
              <span key={id} style={{ fontSize: 11, background: 'rgba(59,130,246,0.1)', color: 'var(--blue)', borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>
                {facultyName(id)}
              </span>
            ))}
          </div>
        : <span style={{ color: 'var(--text-2)', fontSize: 12 }}>None</span>,
    },
    {
      key: 'studentsList',
      label: 'Students',
      render: item => item.studentsList?.length
        ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {item.studentsList.map(id => (
              <span key={id} style={{ fontSize: 11, background: 'rgba(22,163,74,0.1)', color: '#16A34A', borderRadius: 12, padding: '2px 8px', fontWeight: 600 }}>
                {studentName(id)}
              </span>
            ))}
          </div>
        : <span style={{ color: 'var(--text-2)', fontSize: 12 }}>None</span>,
    },
    { key: 'status',    label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Research Projects" subtitle="Manage research and academic projects"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />New Project</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn icon-btn-success" onClick={() => { setSelected(item); setAddId(''); setModal('manageFaculty'); }} title="Manage co-investigators"><BsPersonPlus size={13} /></button>
            <button className="icon-btn" onClick={() => { setSelected(item); setAddId(''); setModal('manageStudent'); }} title="Manage students"><BsMortarboard size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal show={modal === 'create'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>New Research Project</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Faculty Lead</label>
            <select className="form-select" value={facultyId} onChange={e => setFacultyId(e.target.value)}>
              <option value="">Select faculty lead</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
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

      {/* Manage Co-Investigators Modal */}
      <Modal show={modal === 'manageFaculty'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Co-Investigators — {selected?.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {/* Current members */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Current Co-Investigators</label>
            {selected?.facultyMembersIdList?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.facultyMembersIdList.map(id => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px' }}>
                    <span style={{ fontSize: 13 }}>{facultyName(id)}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleRemoveFaculty(id)} title="Remove"><BsXCircle size={13} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>No co-investigators assigned.</p>
            )}
          </div>
          {/* Add new */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <label className="form-label">Add Co-Investigator</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" value={addId} onChange={e => setAddId(e.target.value)}>
                <option value="">Select faculty member</option>
                {faculties.filter(f => !selected?.facultyMembersIdList?.includes(f.id)).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAddFaculty} disabled={saving || !addId} style={{ whiteSpace: 'nowrap' }}>
                {saving && <span className="spinner-border spinner-border-sm me-2" />}Add
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Close</button>
        </Modal.Footer>
      </Modal>

      {/* Manage Students Modal */}
      <Modal show={modal === 'manageStudent'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Students — {selected?.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {/* Current students */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label">Current Students</label>
            {selected?.studentsList?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.studentsList.map(id => (
                  <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 12px' }}>
                    <span style={{ fontSize: 13 }}>{studentName(id)}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleRemoveStudent(id)} title="Remove"><BsXCircle size={13} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--text-2)' }}>No students assigned.</p>
            )}
          </div>
          {/* Add new */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <label className="form-label">Add Student</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="form-select" value={addId} onChange={e => setAddId(e.target.value)}>
                <option value="">Select student</option>
                {students.filter(s => !selected?.studentsList?.includes(s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAddStudent} disabled={saving || !addId} style={{ whiteSpace: 'nowrap' }}>
                {saving && <span className="spinner-border spinner-border-sm me-2" />}Add
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Close</button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
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
