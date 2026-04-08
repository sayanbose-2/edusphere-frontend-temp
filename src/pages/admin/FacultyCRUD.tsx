import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Column } from '@/components/ui/DataTable';
import type { Faculty, Department, CreateFacultyRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function FacultyCRUD() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Faculty | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<Status>(Status.ACTIVE);

  const load = async () => {
    try {
      setLoading(true);
      const [f, d] = await Promise.all([facultyService.getAll(), departmentService.getAll()]);
      setItems(f); setDepartments(d);
    } catch { toast.error('Failed to load faculty'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setName(''); setEmail(''); setPassword(''); setPhone(''); setDepartmentId(''); setPosition(''); setStatus(Status.ACTIVE); setModal('create'); };
  const openEdit = (item: Faculty) => { setSelected(item); setName(item.name); setEmail(item.email); setPassword(''); setPhone(item.phone); setDepartmentId(item.departmentId); setPosition(item.position); setStatus(item.status); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        await facultyService.update(selected.id, { name, email, phone, departmentId, position, status });
        toast.success('Faculty updated');
      } else {
        const payload: CreateFacultyRequest = { name, email, password, phone, departmentId, position, status };
        await facultyService.create(payload);
        toast.success('Faculty created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save faculty'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await facultyService.delete(selected.id); toast.success('Faculty deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete faculty'); }
    finally { setSaving(false); }
  };

  const deptName = (id: string) => departments.find(d => d.id === id)?.departmentName ?? '—';

  const columns: Column<Faculty>[] = [
    { key: 'name',         label: 'Name' },
    { key: 'email',        label: 'Email' },
    { key: 'position',     label: 'Position' },
    { key: 'departmentId', label: 'Department', render: item => item.departmentName ?? deptName(item.departmentId) },
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
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Faculty' : 'Add Faculty Member'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@school.edu" />
            </div>
          </div>
          {!selected && (
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">Password</label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Initial password" />
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Position</label>
              <input className="form-control" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Associate Professor" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Department</label>
              <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
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
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete "{selected?.name}"?</p>
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
