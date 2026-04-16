import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsPersonCheck } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { Role, Status } from '@/types/enums';
import type { Column } from '@/components/common/DataTable';
import type { IDepartment, IFaculty, IPageResponse, ICreateDepartmentRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | 'assign' | null;

const EMPTY_FORM = { departmentName: '', departmentCode: '', contactInfo: '', status: Status.ACTIVE as Status, headId: '' };
const EMPTY_DATA = { items: [] as IDepartment[], faculties: [] as IFaculty[] };

const DepartmentPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IDepartment | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [d, f] = await Promise.all([
        apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []),
        apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []),
      ]);
      // dept head only sees their own department
      setData({ items: isDeptHead && !isAdmin ? d.filter(dept => dept.headId === user?.id) : d, faculties: f });
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load departments');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setForm({ ...EMPTY_FORM }); setModal('create'); };
  const openEdit = (item: IDepartment) => { setSelected(item); setForm({ departmentName: item.departmentName, departmentCode: item.departmentCode, contactInfo: item.contactInfo, status: item.status, headId: '' }); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: ICreateDepartmentRequest = { departmentName: form.departmentName, departmentCode: form.departmentCode, contactInfo: form.contactInfo, status: form.status };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/departments/${selected.id}`, payload);
        toast.success('Department updated');
      } else {
        await apiClient.post('/departments', payload);
        toast.success('Department created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save department'); } finally { setSaving(false); }
  };

  const handleAssignHead = async () => {
    if (!selected || !form.headId) { toast.error('Select a faculty member'); return; }
    setSaving(true);
    try {
      await apiClient.patch(`/departments/${selected.id}/head`, null, { params: { headId: form.headId } });

      const newHead = data.faculties.find(f => f.id === form.headId);
      if (newHead) {
        await apiClient.patch(`/users/${newHead.userId}`, { roles: [Role.FACULTY, Role.DEPARTMENT_HEAD], replaceRoles: true });
      }
      // remove dept head role from prev head if different
      if (selected.headId && selected.headId !== form.headId) {
        const prevHead = data.faculties.find(f => f.id === selected.headId);
        if (prevHead) {
          await apiClient.patch(`/users/${prevHead.userId}`, { roles: [Role.FACULTY], replaceRoles: true });
        }
      }
      toast.success('Department head assigned'); setModal(null); load();
    } catch { toast.error('Failed to assign head'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/departments/${selected.id}`);
      toast.success('Department deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete department'); } finally { setSaving(false); }
  };

  const columns: Column<IDepartment>[] = [
    { key: 'departmentName', label: 'Name' },
    { key: 'departmentCode', label: 'Code' },
    { key: 'contactInfo',    label: 'Contact' },
    { key: 'headName',       label: 'Head', render: item => item.headName ?? data.faculties.find(f => f.id === item.headId)?.name ?? '—' },
    { key: 'status',         label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle={isDeptHead && !isAdmin ? 'Your department' : 'Manage academic departments'}
        action={isAdmin ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Department</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={isAdmin ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-success" onClick={() => { setSelected(item); setForm(f => ({ ...f, headId: '' })); setModal('assign'); }} title="Assign Head"><BsPersonCheck size={14} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Department' : 'New Department'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Department Name</label>
            <input className="form-control" value={form.departmentName} onChange={e => setForm(f => ({ ...f, departmentName: e.target.value }))} placeholder="e.g. Computer Science" />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Department Code</label>
            <input className="form-control" value={form.departmentCode} onChange={e => setForm(f => ({ ...f, departmentCode: e.target.value }))} placeholder="e.g. CS" />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Contact Info</label>
            <input className="form-control" value={form.contactInfo} onChange={e => setForm(f => ({ ...f, contactInfo: e.target.value }))} placeholder="Email or phone" />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'assign'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Assign Department Head</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-xs text-secondary mb-3.5">Assign head for <strong>{selected?.departmentName}</strong></p>
          <label className="form-label">Select Faculty</label>
          <select className="form-select" value={form.headId} onChange={e => setForm(f => ({ ...f, headId: e.target.value }))}>
            <option value="">Select faculty member</option>
            {data.faculties.filter(f => f.departmentId === selected?.id).map(f => (
              <option key={f.id} value={f.id}>{f.name}{f.id === selected?.headId ? ' (current head)' : ''}</option>
            ))}
          </select>
          {data.faculties.filter(f => f.departmentId === selected?.id).length === 0 && (
            <p className="text-xs text-tertiary mt-2">No faculty in this department yet. Add faculty first.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleAssignHead} disabled={saving}>Assign</button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} label={selected?.departmentName} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default DepartmentPage;
