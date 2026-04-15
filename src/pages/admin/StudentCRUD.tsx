import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsInfoCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { studentService } from '@/services/student.service';
import { authService } from '@/services/auth.service';
import { Gender, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Column } from '@/components/ui/DataTable';
import type { Student } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function StudentCRUD() {
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  // IAM fields (create only — admin creates the login account)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Profile fields (edit only — student fills these on first login)
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setItems(await studentService.getAll());
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSelected(null);
    setName(''); setEmail(''); setPassword(''); setPhone('');
    setModal('create');
  };

  const openEdit = (item: Student) => {
    setSelected(item);
    setDob(item.dob ?? '');
    setGender(item.gender ?? '');
    setAddress(item.address ?? '');
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        // Update profile fields (name/email/phone are IAM-managed, not editable here)
        await studentService.update(selected.id, {
          userId: selected.userId,
          dob,
          gender,
          address,
        });
        toast.success('Student profile updated');
      } else {
        // Admin creates the IAM account only.
        // The student fills their own profile (dob, gender, address) on first login.
        if (!name.trim() || !email.trim() || password.length < 8) {
          toast.error('Name, email, and a password of at least 8 characters are required');
          return;
        }
        await authService.register({ name, email, password, phone, roles: [Role.STUDENT] });
        toast.success('Student account created. Share the credentials so they can log in and complete their profile.');
      }
      setModal(null);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await studentService.delete(selected.id);
      toast.success('Student deleted');
      setModal(null);
      load();
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Student>[] = [
    { key: 'name',           label: 'Name' },
    { key: 'email',          label: 'Email' },
    { key: 'phone',          label: 'Phone' },
    { key: 'gender',         label: 'Gender', render: item => item.gender ? formatEnum(item.gender) : '—' },
    { key: 'enrollmentDate', label: 'Enrolled', render: item => item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : '—' },
    { key: 'status',         label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Students" subtitle="Manage student accounts"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Student</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit profile"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      {/* Create — IAM account only */}
      <Modal show={modal === 'create'} onHide={() => setModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Student Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Info banner */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', marginBottom: 20, fontSize: 13, color: 'var(--text-2)' }}>
            <BsInfoCircle size={15} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 1 }} />
            <span>
              Create the login account here and share the credentials with the student.
              They will fill in their personal details (date of birth, gender, address) on their first login.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Full Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Student name" required />
            </div>
            <div>
              <label className="form-label">Email <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label className="form-label">Password <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
            </div>
            <div>
              <label className="form-label">Phone <span style={{ color: 'var(--text-3)', fontSize: 12 }}></span></label>
              <input className="form-control" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Create Account
          </button>
        </Modal.Footer>
      </Modal>

      {/* Edit — profile fields */}
      <Modal show={modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Student Profile — {selected?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Read-only IAM info */}
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><span style={{ color: 'var(--text-3)' }}>Name</span><br /><span style={{ color: 'var(--text)', fontWeight: 500 }}>{selected?.name}</span></div>
              <div><span style={{ color: 'var(--text-3)' }}>Email</span><br /><span style={{ color: 'var(--text)', fontWeight: 500 }}>{selected?.email}</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-control" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option value="">Select gender</option>
                {Object.values(Gender).map(g => <option key={g} value={g}>{formatEnum(g)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea className="form-control" rows={2} value={address} onChange={e => setAddress(e.target.value)} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save Changes
          </button>
        </Modal.Footer>
      </Modal>

      {/* Delete confirmation */}
      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete "{selected?.name}"?</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>This will also remove their login account. This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
