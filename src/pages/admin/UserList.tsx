import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsToggleOn, BsToggleOff, BsPersonPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import { Status, Role } from '@/types/enums';
import type { Column } from '@/components/ui/DataTable';
import type { User } from '@/types/academic.types';

type ModalMode = 'edit' | 'delete' | 'create' | null;

// DEPARTMENT_HEAD is excluded — it must be assigned via Departments → Assign Head (requires a faculty profile)
const STAFF_ROLES = [Role.ADMIN, Role.COMPLIANCE_OFFICER, Role.REGULATOR];

export default function UserList() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>(Status.ACTIVE);

  // Create form state
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createRole, setCreateRole] = useState<Role>(Role.COMPLIANCE_OFFICER);

  const load = async () => {
    try { setLoading(true); setItems(await userService.getAll()); }
    catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load users');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (item: User) => { setSelected(item); setName(item.name); setPhone(item.phone); setStatus(item.status); setModal('edit'); };

  const openCreate = () => {
    setCreateName(''); setCreateEmail(''); setCreatePassword(''); setCreatePhone(''); setCreateRole(Role.COMPLIANCE_OFFICER);
    setModal('create');
  };

  const handleCreate = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword.trim()) {
      toast.error('Name, email and password are required'); return;
    }
    setSaving(true);
    try {
      await authService.register({ name: createName, email: createEmail, password: createPassword, phone: createPhone || undefined, roles: [createRole] });
      toast.success('Staff account created'); setModal(null); load();
    } catch { toast.error('Failed to create account'); }
    finally { setSaving(false); }
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await userService.update(selected.id, { name, phone, status, roles: selected.roles });
      toast.success('User updated'); setModal(null); load();
    } catch { toast.error('Failed to update user'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (item: User) => {
    try {
      await userService.toggleStatus(item.id, item.status === 'ACTIVE' ? Status.INACTIVE : Status.ACTIVE);
      toast.success('Status toggled'); load();
    } catch { toast.error('Failed to toggle status'); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await userService.delete(selected.id); toast.success('User deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete user'); }
    finally { setSaving(false); }
  };

  const columns: Column<User>[] = [
    { key: 'name',   label: 'Name' },
    { key: 'email',  label: 'Email' },
    { key: 'phone',  label: 'Phone' },
    { key: 'roles',  label: 'Roles', render: item => item.roles?.map(r => formatEnum(r)).join(', ') || '—' },
    { key: 'status', label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Users" subtitle="Manage system accounts and access"
        action={
          <button className="btn btn-primary btn-sm" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BsPersonPlus size={14} /> Create Staff Account
          </button>
        }
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button
              className={`icon-btn ${item.status === 'ACTIVE' ? 'icon-btn-warn' : 'icon-btn-success'}`}
              onClick={() => handleToggle(item)}
              title={item.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
            >
              {item.status === 'ACTIVE' ? <BsToggleOn size={15} /> : <BsToggleOff size={15} />}
            </button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Edit User</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Name</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Email (read-only)</label>
            <input className="form-control" value={selected?.email ?? ''} readOnly style={{ opacity: 0.6 }} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Phone</label>
            <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
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
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Role</label>
            <select className="form-select" value={createRole} onChange={e => setCreateRole(e.target.value as Role)}>
              {STAFF_ROLES.map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Full Name <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-control" value={createName} onChange={e => setCreateName(e.target.value)} placeholder="e.g. Jane Smith" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Email <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-control" type="email" value={createEmail} onChange={e => setCreateEmail(e.target.value)} placeholder="jane@university.edu" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Password <span style={{ color: '#EF4444' }}>*</span></label>
            <input className="form-control" type="password" value={createPassword} onChange={e => setCreatePassword(e.target.value)} placeholder="Temporary password" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input className="form-control" value={createPhone} onChange={e => setCreatePhone(e.target.value)} placeholder="+1 555 000 0000 (optional)" />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Create Account
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete "{selected?.name}"?</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>This action is permanent.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
