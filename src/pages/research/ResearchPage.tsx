import { DateInput } from '@/components/common/DateInput';
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsTrash, BsPlus, BsPersonPlus, BsMortarboard, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { ProjectStatus, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IResearchProject, IFaculty, IStudent, IPageResponse, ICreateResearchProjectRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'delete' | 'manageFaculty' | 'manageStudent' | null;

const EMPTY_FORM = { title: '', facultyId: '', startDate: '', endDate: '', status: ProjectStatus.ACTIVE, addId: '' };
const EMPTY_DATA = { items: [] as IResearchProject[], faculties: [] as IFaculty[], students: [] as IStudent[] };

const ResearchPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IResearchProject | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const allProjects = await apiClient.get<IPageResponse<IResearchProject>>('/research-projects').then(r => r.data.content ?? []);

      if (isFaculty) {
        // show only projects where this faculty is lead or co-investigator
        const me = await apiClient.get<{ id: string }>('/faculties/me').then(r => r.data);
        const items = allProjects.filter(p => p.facultyId === me.id || p.facultyMembersIdList?.includes(me.id));
        // still need faculty list for rendering names
        const [f, s] = await Promise.all([
          apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
        ]);
        setData({ items, faculties: f, students: s });
      } else if (user?.roles.includes(Role.STUDENT)) {
        const me = await apiClient.get<IStudent>('/students/me').then(r => r.data);
        const items = allProjects.filter(p => p.studentsList?.includes(me.id));
        const uniqueFacultyIds = [...new Set(items.flatMap(p => [p.facultyId, ...(p.facultyMembersIdList ?? [])]).filter(Boolean))];
        const uniqueStudentIds = [...new Set(items.flatMap(p => p.studentsList ?? []).filter(Boolean))];
        const [faculties, students] = await Promise.all([
          Promise.all(uniqueFacultyIds.map(id => apiClient.get<IFaculty>(`/faculties/${id}`).then(r => r.data).catch(() => null))),
          Promise.all(uniqueStudentIds.map(id => apiClient.get<IStudent>(`/students/${id}`).then(r => r.data).catch(() => null))),
        ]);
        setData(d => ({ ...d, items, faculties: faculties.filter(Boolean) as IFaculty[], students: students.filter(Boolean) as IStudent[] }));
      } else {
        // admin sees everything
        const [f, s] = await Promise.all([
          apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
        ]);
        setData({ items: allProjects, faculties: f, students: s });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load research projects');
    } finally { setLoading(false); }
  };

  // keep selected in sync after load
  useEffect(() => {
    if (selected) setSelected(data.items.find(i => i.id === selected.id) ?? null);
  }, [data.items]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: ICreateResearchProjectRequest = { title: form.title, facultyId: form.facultyId, facultyMembers: [], students: [], startDate: form.startDate, endDate: form.endDate, status: form.status };
      await apiClient.post('/research-projects', payload);
      toast.success('Project created'); setModal(null); load();
    } catch { toast.error('Failed to create project'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/research-projects/${selected.id}`);
      toast.success('Project deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete project'); } finally { setSaving(false); }
  };

  const handleAddFaculty = async () => {
    if (!selected || !form.addId) return;
    setSaving(true);
    try {
      await apiClient.post(`/research-projects/${selected.id}/faculty`, null, { params: { facultyId: form.addId } });
      toast.success('Co-investigator added'); setForm(f => ({ ...f, addId: '' })); load();
    } catch { toast.error('Failed to add co-investigator'); } finally { setSaving(false); }
  };

  const handleRemoveFaculty = async (fId: string) => {
    if (!selected) return;
    try {
      await apiClient.delete(`/research-projects/${selected.id}/faculty/${fId}`);
      toast.success('Co-investigator removed'); load();
    } catch { toast.error('Failed to remove co-investigator'); }
  };

  const handleAddStudent = async () => {
    if (!selected || !form.addId) return;
    setSaving(true);
    try {
      await apiClient.post(`/research-projects/${selected.id}/students`, null, { params: { studentId: form.addId } });
      toast.success('Student added'); setForm(f => ({ ...f, addId: '' })); load();
    } catch { toast.error('Failed to add student'); } finally { setSaving(false); }
  };

  const handleRemoveStudent = async (sId: string) => {
    if (!selected) return;
    try {
      await apiClient.delete(`/research-projects/${selected.id}/students/${sId}`);
      toast.success('Student removed'); load();
    } catch { toast.error('Failed to remove student'); }
  };

  const facultyName = (id: string) => data.faculties.find(f => f.id === id)?.name ?? '—';
  const studentName = (id: string) => data.students.find(s => s.id === id)?.name ?? '—';

  const canManage = isAdmin || isFaculty;

  const columns: Column<IResearchProject>[] = [
    { key: 'title',     label: 'Title' },
    { key: 'facultyId', label: 'Lead Faculty', render: item => facultyName(item.facultyId) },
    { key: 'startDate', label: 'Start', render: item => new Date(item.startDate).toLocaleDateString() },
    { key: 'endDate',   label: 'End',   render: item => new Date(item.endDate).toLocaleDateString() },
    {
      key: 'facultyMembersIdList',
      label: 'Co-Investigators',
      render: item => item.facultyMembersIdList?.length
        ? <div className="flex flex-col gap-1">
            {item.facultyMembersIdList.map(id => (
              <span key={id} className="text-xs bg-blue/10 text-blue rounded-full px-2 py-0.5 font-semibold w-fit">{facultyName(id)}</span>
            ))}
          </div>
        : <span className="text-secondary text-sm">—</span>,
    },
    {
      key: 'studentsList',
      label: 'Students',
      render: item => item.studentsList?.length
        ? <div className="flex flex-col gap-1">
            {item.studentsList.map(id => (
              <span key={id} className="text-xs bg-green-600/10 text-green-600 rounded-full px-2 py-0.5 font-semibold w-fit">{studentName(id)}</span>
            ))}
          </div>
        : <span className="text-secondary text-sm">—</span>,
    },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Research Projects"
        subtitle={user?.roles.includes(Role.STUDENT) ? 'Projects you are part of' : isFaculty ? 'Projects you lead or co-investigate' : 'Manage research and academic projects'}
        action={canManage ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />New Project</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={canManage ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn icon-btn-success" onClick={() => { setSelected(item); setForm(f => ({ ...f, addId: '' })); setModal('manageFaculty'); }} title="Manage co-investigators"><BsPersonPlus size={13} /></button>
            <button className="icon-btn" onClick={() => { setSelected(item); setForm(f => ({ ...f, addId: '' })); setModal('manageStudent'); }} title="Manage students"><BsMortarboard size={13} /></button>
            {isAdmin && <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>}
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>New Research Project</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Title</label>
            <input className="form-control" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Project title" />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Faculty Lead</label>
            <select className="form-select" value={form.facultyId} onChange={e => setForm(f => ({ ...f, facultyId: e.target.value }))}>
              <option value="">Select faculty lead</option>
              {data.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Start Date</label>
              <DateInput value={form.startDate} onChange={v => setForm(f => ({ ...f, startDate: v }))} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <DateInput value={form.endDate} onChange={v => setForm(f => ({ ...f, endDate: v }))} min={form.startDate || undefined} />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}>
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

      {/* manage co-investigators */}
      <Modal show={modal === 'manageFaculty'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Co-Investigators — {selected?.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="form-label">Current Co-Investigators</label>
            {selected?.facultyMembersIdList?.length ? (
              <div className="flex flex-col gap-1.5">
                {selected.facultyMembersIdList.map(id => (
                  <div key={id} className="flex justify-between items-center bg-surface border border-border rounded p-1.5">
                    <span className="text-base">{facultyName(id)}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleRemoveFaculty(id)}><BsXCircle size={13} /></button>
                  </div>
                ))}
              </div>
            ) : <p className="text-base text-secondary">No co-investigators assigned.</p>}
          </div>
          <div className="border-t border-border pt-3.5">
            <label className="form-label">Add Co-Investigator</label>
            <div className="flex gap-2">
              <select className="form-select" value={form.addId} onChange={e => setForm(f => ({ ...f, addId: e.target.value }))}>
                <option value="">Select faculty member</option>
                {data.faculties.filter(f => !selected?.facultyMembersIdList?.includes(f.id)).map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={handleAddFaculty} disabled={saving || !form.addId}>
                {saving && <span className="spinner-border spinner-border-sm me-2" />}Add
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Close</button>
        </Modal.Footer>
      </Modal>

      {/* manage students */}
      <Modal show={modal === 'manageStudent'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Students — {selected?.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-4">
            <label className="form-label">Current Students</label>
            {selected?.studentsList?.length ? (
              <div className="flex flex-col gap-1.5">
                {selected.studentsList.map(id => (
                  <div key={id} className="flex justify-between items-center bg-surface border border-border rounded p-1.5">
                    <span className="text-base">{studentName(id)}</span>
                    <button className="icon-btn icon-btn-danger" onClick={() => handleRemoveStudent(id)}><BsXCircle size={13} /></button>
                  </div>
                ))}
              </div>
            ) : <p className="text-base text-secondary">No students assigned.</p>}
          </div>
          <div className="border-t border-border pt-3.5">
            <label className="form-label">Add Student</label>
            <div className="flex gap-2">
              <select className="form-select" value={form.addId} onChange={e => setForm(f => ({ ...f, addId: e.target.value }))}>
                <option value="">Select student</option>
                {data.students.filter(s => !selected?.studentsList?.includes(s.id)).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm whitespace-nowrap" onClick={handleAddStudent} disabled={saving || !form.addId}>
                {saving && <span className="spinner-border spinner-border-sm me-2" />}Add
              </button>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Close</button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} label={selected?.title} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default ResearchPage;
