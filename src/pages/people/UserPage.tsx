import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsToggleOn, BsToggleOff, BsPersonPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { formatEnum } from '@/utils/formatters';
import { Status, Role } from '@/types/enums';
import type { Column } from '@/components/common/DataTable';
import type { IUser, IPageResponse } from '@/types/academicTypes';

type TModalMode = 'edit' | 'delete' | 'create' | null;

// dept head is assigned via Departments page — not here
const STAFF_ROLES = [Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.REGULATOR];

const EMPTY_FORM = { name: '', phone: '', status: Status.ACTIVE as Status };
const EMPTY_CREATE_FORM = { name: '', email: '', password: '', phone: '', role: Role.COMPLIANCE_OFFICER as Role };

const UserPage = () => {
  const [data, setData] = useState({ items: [] as IUser[] });
  const [form, setForm] = useState(EMPTY_FORM);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IUser | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<IPageResponse<IUser> | IUser[]>('/users');
      const d = res.data;
      setData({ items: Array.isArray(d) ? d : (d.content ?? []) });
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load users');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item: IUser) => { setSelected(item); setForm({ name: item.name, phone: item.phone ?? '', status: item.status }); setModal('edit'); };
  const openCreate = () => {
    setCreateForm(EMPTY_CREATE_FORM);
    setModal('create');
  };

  const handleCreate = async () => {
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password.trim()) {
      toast.error('Name, email and password are required'); return;
    }
    setSaving(true);
    try {
      await apiClient.post('/auth/register', { name: createForm.name, email: createForm.email, password: createForm.password, phone: createForm.phone || undefined, roles: [createForm.role] });
      toast.success('Staff account created'); setModal(null); load();
    } catch { toast.error('Failed to create account'); } finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.patch(`/users/${selected.id}`, { name: form.name, phone: form.phone, status: form.status, roles: selected.roles });
      toast.success('User updated'); setModal(null); load();
    } catch { toast.error('Failed to update user'); } finally { setSaving(false); }
  };

  const handleToggle = async (item: IUser) => {
    try {
      const newStatus = item.status === 'ACTIVE' ? Status.INACTIVE : Status.ACTIVE;
      await apiClient.patch(`/users/${item.id}`, { status: newStatus });
      toast.success('Status updated'); load();
    } catch { toast.error('Failed to toggle status'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/users/${selected.id}`);
      toast.success('User deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete user'); } finally { setSaving(false); }
  };

  const columns: Column<IUser>[] = [
    { key: 'name',   label: 'Name' },
    { key: 'email',  label: 'Email' },
    { key: 'phone',  label: 'Phone' },
    { key: 'roles',  label: 'Roles',  render: item => item.roles?.map(r => formatEnum(r)).join(', ') || '—' },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Users" subtitle="Manage system accounts and access"
        action={
          <button className="btn btn-primary btn-sm flex items-center gap-1.5" onClick={openCreate}>
            <BsPersonPlus size={14} /> Create Staff Account
          </button>
        }
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className={`icon-btn ${item.status === 'ACTIVE' ? 'icon-btn-warn' : 'icon-btn-success'}`} onClick={() => handleToggle(item)} title="Toggle status">
              {item.status === 'ACTIVE' ? <BsToggleOn size={15} /> : <BsToggleOff size={15} />}
            </button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Edit User</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Name</label>
            <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Email (read-only)</label>
            <input className="form-control opacity-60" value={selected?.email ?? ''} readOnly />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Phone</label>
            <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
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

      <Modal show={modal === 'create'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Create Staff Account</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Role</label>
            <select className="form-select" value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value as Role }))}>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
            </select>
          </div>
          <div className="mb-3.5">
            <label className="form-label">Full Name *</label>
            <input className="form-control" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Jane Smith" />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Email *</label>
            <input type="email" className="form-control" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="mb-3.5">
            <label className="form-label">Password *</label>
            <input type="password" className="form-control" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Temporary password" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-control" value={createForm.phone} onChange={e => setCreateForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Create Account
          </button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} label={selected?.name} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default UserPage;
