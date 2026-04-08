import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { studentService } from '@/services/student.service';
import { Gender } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Column } from '@/components/ui/DataTable';
import type { Student, CreateStudentRequest } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function StudentCRUD() {
  const [items, setItems] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [address, setAddress] = useState('');

  const load = async () => {
    try { setLoading(true); setItems(await studentService.getAll()); }
    catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setName(''); setEmail(''); setPassword(''); setPhone(''); setDob(''); setGender(''); setAddress(''); setModal('create'); };
  const openEdit = (item: Student) => { setSelected(item); setName(item.name); setEmail(item.email); setPassword(''); setPhone(item.phone); setDob(item.dob); setGender(item.gender as Gender); setAddress(item.address); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        await studentService.update(selected.id, { name, email, phone, dob, gender, address });
        toast.success('Student updated');
      } else {
        const payload: CreateStudentRequest = { name, email, password, phone, dob, gender, address };
        await studentService.create(payload);
        toast.success('Student created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save student'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await studentService.delete(selected.id); toast.success('Student deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete student'); }
    finally { setSaving(false); }
  };

  const columns: Column<Student>[] = [
    { key: 'name',           label: 'Name' },
    { key: 'email',          label: 'Email' },
    { key: 'phone',          label: 'Phone' },
    { key: 'gender',         label: 'Gender' },
    { key: 'enrollmentDate', label: 'Enrolled', render: item => item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : '—' },
    { key: 'status',         label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Students" subtitle="Manage student records"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Student</button>}
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
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Student' : 'Add Student'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Student name" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-control" value={email} onChange={e => setEmail(e.target.value)} />
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
              <label className="form-label">Date of Birth</label>
              <input type="date" className="form-control" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Gender</label>
              <select className="form-select" value={gender} onChange={e => setGender(e.target.value as Gender)}>
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
