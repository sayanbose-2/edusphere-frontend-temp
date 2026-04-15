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
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load research projects');
    }
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
    try { await researchService.delete(selected.id); toast.success('Project deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete project'); }
    finally { setSaving(false); }
  };

  const handleAddFaculty = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try {
      await researchService.addFaculty(selected.id, addId);
      toast.success('Co-investigator added'); setAddId(''); load();
    } catch { toast.error('Failed to add co-investigator'); }
    finally { setSaving(false); }
  };

  const handleRemoveFaculty = async (fId: string) => {
    if (!selected) return;
    try {
      await researchService.removeFaculty(selected.id, fId);
      toast.success('Co-investigator removed'); load();
    } catch { toast.error('Failed to remove co-investigator'); }
  };

  const handleAddStudent = async () => {
    if (!selected || !addId) return;
    setSaving(true);
    try {
      await researchService.addStudent(selected.id, addId);
      toast.success('Student added'); setAddId(''); load();
    } catch { toast.error('Failed to add student'); }
    finally { setSaving(false); }
  };

  const handleRemoveStudent = async (sId: string) => {
    if (!selected) return;
    try {
      await researchService.removeStudent(selected.id, sId);
      toast.success('Student removed'); load();
    } catch { toast.error('Failed to remove student'); }
  };

  const facultyName = (id: string) => faculties.find(f => f.id === id)?.name ?? id.slice(0, 8) + '…';
  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? id.slice(0, 8) + '…';

  // Keep selected in sync after load (so manage modals reflect latest state)
  useEffect(() => {
    if (selected) setSelected(items.find(i => i.id === selected.id) ?? null);
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
        ? <div className="flex flex-wrap gap-1">
            {item.facultyMembersIdList.map(id => (
              <span key={id} className="text-xs bg-blue/10 text-blue rounded-full px-2 py-0.5 font-semibold">
                {facultyName(id)}
              </span>
            ))}
          </div>
        : <span className="text-secondary text-sm">None</span>,
    },
    {
      key: 'studentsList',
      label: 'Students',
      render: item => item.studentsList?.length
        ? <div className="flex flex-wrap gap-1">
            {item.studentsList.map(id => (
              <span key={id} className="text-xs bg-green-600/10 text-green-600 rounded-full px-2 py-0.5 font-semibold">
                {studentName(id)}
              </span>
            ))}
          </div>
        : <span className="text-secondary text-sm">None</span>,
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
          <div className="flex gap-1.5">
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
          <div className="mb-3.5">
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Project title" />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Faculty Lead</label>
            <select className="form-select" value={facultyId} onChange={e => setFacultyId(e.target.value)}>
              <option value="">Select faculty lead</option>
              {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
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
          <div className="mb-4">
            <label className="form-label">Current Co-Investigators</label>
            {selected?.facultyMembersIdList?.length ? (
              <div className="flex flex-col gap-1.5">
                {selected.facultyMembersIdList.map(id => (
                  <div key={id} className="flex justify-between items-center bg-surface border border-border rounded p-1.5">
                    <span className="text-base">{facultyName(id)}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleRemoveFaculty(id)} title="Remove"><BsXCircle size={13} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-secondary">No co-investigators assigned.</p>
            )}
          </div>
          {/* Add new */}
          <div className="border-t border-border pt-3.5">
            <label className="form-label">Add Co-Investigator</label>
            <div className="flex gap-2">
              <select className="form-select" value={addId} onChange={e => setAddId(e.target.value)}>
                <option value="">Select faculty member</option>
                {faculties.filter(f => !selected?.facultyMembersIdList?.includes(f.id)).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={handleAddFaculty} disabled={saving || !addId}>
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
          <div className="mb-4">
            <label className="form-label">Current Students</label>
            {selected?.studentsList?.length ? (
              <div className="flex flex-col gap-1.5">
                {selected.studentsList.map(id => (
                  <div key={id} className="flex justify-between items-center bg-surface border border-border rounded p-1.5">
                    <span className="text-base">{studentName(id)}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleRemoveStudent(id)} title="Remove"><BsXCircle size={13} /></button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-secondary">No students assigned.</p>
            )}
          </div>
          {/* Add new */}
          <div className="border-t border-border pt-3.5">
            <label className="form-label">Add Student</label>
            <div className="flex gap-2">
              <select className="form-select" value={addId} onChange={e => setAddId(e.target.value)}>
                <option value="">Select student</option>
                {students.filter(s => !selected?.studentsList?.includes(s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={handleAddStudent} disabled={saving || !addId}>
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
        <Modal.Body className="p-7 text-center">
          <p className="font-semibold mb-1.5">Delete "{selected?.title}"?</p>
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
