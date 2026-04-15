import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { authService } from '@/services/auth.service';
import { decodeJwt } from '@/lib/jwt';
import { Role, Status } from '@/types/enums';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Column } from '@/components/ui/DataTable';
import type { Faculty, Department } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function FacultyCRUD() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [saving, setSaving] = useState(false);

  // IAM fields (create only)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Profile fields
  const [departmentId, setDepartmentId] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<Status>(Status.ACTIVE);

  const load = async () => {
    try {
      setLoading(true);
      const [f, d] = await Promise.all([facultyService.getAll(), departmentService.getAll()]);
      setItems(f);
      setDepartments(d);
    } catch (err: unknown) {
      const errStatus = (err as { response?: { status?: number } })?.response?.status;
      if (errStatus !== 404 && errStatus !== 500) toast.error('Failed to load faculty');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSelected(null);
    setName(''); setEmail(''); setPassword(''); setPhone('');
    setDepartmentId(''); setPosition(''); setStatus(Status.ACTIVE);
    setModal('create');
  };

  const openEdit = (item: Faculty) => {
    setSelected(item);
    setDepartmentId(item.departmentId);
    setPosition(item.position);
    setStatus(item.status);
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        // Update profile fields only (name/email/phone are IAM-managed)
        await facultyService.update(selected.id, {
          userId: selected.userId,
          position,
          departmentId,
          status,
        });
        toast.success('Faculty updated');
      } else {
        // Step 1: Create IAM user account
        const authResp = await authService.register({
          name, email, password, phone,
          roles: [Role.FACULTY],
        });
        // Step 2: Extract userId from the returned token
        const decoded = decodeJwt(authResp.accessToken);
        const userId = decoded.userId;
        // Step 3: Create faculty profile
        await facultyService.create({ userId, position, departmentId, status });
        toast.success('Faculty member created');
      }
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save faculty');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await facultyService.delete(selected.id);
      toast.success('Faculty deleted');
      setModal(null);
      load();
    } catch {
      toast.error('Failed to delete faculty');
    } finally {
      setSaving(false);
    }
  };

  const deptHeadIds = new Set(departments.map(d => d.headId).filter(Boolean));

  const columns: Column<Faculty>[] = [
    { key: 'name', label: 'Name', render: item => (
      <span className="flex items-center gap-1.5">
        {item.name}
        {deptHeadIds.has(item.id) && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-navy text-white tracking-wider whitespace-nowrap">
            Dept. Head
          </span>
        )}
      </span>
    )},
    { key: 'email',        label: 'Email' },
    { key: 'position',     label: 'Position' },
    { key: 'departmentId', label: 'Department', render: item => item.departmentName ?? departments.find(d => d.id === item.departmentId)?.departmentName ?? '—' },
    { key: 'joinDate',     label: 'Joined', render: item => item.joinDate ? new Date(item.joinDate).toLocaleDateString() : '—' },
    { key: 'status',       label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Faculty" subtitle="Manage faculty members"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Faculty</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{modal === 'edit' ? 'Edit Faculty' : 'Add Faculty Member'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modal === 'create' && (
            <>
              <p className="text-xs text-tertiary bg-bg-2 p-2.5 rounded mb-3.5">
                Step 1 — Account credentials (used to log in)
              </p>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@school.edu" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                <div>
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
              </div>
              <p className="text-xs text-tertiary bg-bg-2 p-2.5 rounded mb-3.5">
                Step 2 — Faculty profile details
              </p>
            </>
          )}

          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Position</label>
              <input className="form-control" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Associate Professor" required />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
                <option value={Status.ACTIVE}>Active</option>
                <option value={Status.INACTIVE}>Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)} required>
              <option value="">Select department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
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

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="p-7 text-center">
          <p className="font-semibold mb-1.5">Delete "{selected?.name}"?</p>
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
