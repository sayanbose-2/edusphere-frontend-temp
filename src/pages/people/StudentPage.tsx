import { useState, useEffect } from 'react';
import { DateInput, today } from '@/components/common/DateInput';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsInfoCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { Gender, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IStudent, IPageResponse } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;

const EMPTY_FORM = {
  // IAM fields — only used when creating
  name: '', email: '', password: '', phone: '',
  // profile fields — used when editing
  dob: '', gender: '', address: '',
};

const StudentPage = () => {
  const [data, setData] = useState({ items: [] as IStudent[] });
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IStudent | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<IPageResponse<IStudent> | IStudent[]>('/students');
      const d = res.data;
      setData({ items: Array.isArray(d) ? d : (d.content ?? []) });
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load students');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const openEdit = (item: IStudent) => {
    setSelected(item);
    setForm(f => ({ ...f, dob: item.dob ?? '', gender: item.gender ?? '', address: item.address ?? '' }));
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        await apiClient.put(`/students/${selected.id}`, { userId: selected.userId, dob: form.dob, gender: form.gender, address: form.address });
        toast.success('Student profile updated');
      } else {
        if (!form.name.trim() || !form.email.trim() || form.password.length < 8) {
          toast.error('Name, email, and password (min 8 chars) are required');
          return;
        }
        await apiClient.post('/auth/register', { name: form.name, email: form.email, password: form.password, phone: form.phone, roles: [Role.STUDENT] });
        toast.success('Student account created');
      }
      setModal(null); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save student');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/students/${selected.id}`);
      toast.success('Student deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete student'); } finally { setSaving(false); }
  };

  const columns: Column<IStudent>[] = [
    { key: 'name',           label: 'Name' },
    { key: 'email',          label: 'Email' },
    { key: 'phone',          label: 'Phone' },
    { key: 'gender',         label: 'Gender',   render: item => item.gender ? formatEnum(item.gender) : '—' },
    { key: 'enrollmentDate', label: 'Enrolled', render: item => item.enrollmentDate ? new Date(item.enrollmentDate).toLocaleDateString() : '—' },
    { key: 'status',         label: 'Status',   render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Students" subtitle="Manage student accounts"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Student</button>}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      {/* create — IAM account only, student fills profile on first login */}
      <Modal show={modal === 'create'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Add Student Account</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="flex gap-2.5 items-start rounded-lg p-3 mb-5 text-sm border bg-bg-2 border-border text-secondary">
            <BsInfoCircle size={15} className="flex-shrink-0 mt-0.5 text-blue" />
            <span>Create the login account and share credentials. The student fills in personal details on first login.</span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student name" />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Password *</label>
              <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
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

      {/* edit — profile fields only */}
      <Modal show={modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Edit Student — {selected?.name}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="rounded p-3.5 mb-4.5 text-sm border border-border bg-bg-2">
            <div className="grid grid-cols-2 gap-2">
              <div><span className="text-xs text-tertiary">Name</span><br /><span className="font-medium">{selected?.name}</span></div>
              <div><span className="text-xs text-tertiary">Email</span><br /><span className="font-medium">{selected?.email}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Date of Birth</label>
              <DateInput value={form.dob} onChange={v => setForm(f => ({ ...f, dob: v }))} max={today} />
            </div>
            <div>
              <label className="form-label">Gender</label>
              <select className="form-select" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                <option value="">Select</option>
                {Object.values(Gender).map(g => <option key={g} value={g}>{formatEnum(g)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save Changes
          </button>
        </Modal.Footer>
      </Modal>

      <DeleteModal show={modal === 'delete'} label={selected?.name} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default StudentPage;
