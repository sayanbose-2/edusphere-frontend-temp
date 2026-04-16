import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { decodeJwt } from '@/lib/jwt';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { Role, Status } from '@/types/enums';
import type { Column } from '@/components/common/DataTable';
import type { IFaculty, IDepartment, IPageResponse, ICreateFacultyRequest } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;

const EMPTY_FORM = {
  // IAM fields (create only)
  name: '', email: '', password: '', phone: '',
  // profile fields
  departmentId: '', position: '', status: Status.ACTIVE as Status,
};
const EMPTY_DATA = { items: [] as IFaculty[], departments: [] as IDepartment[] };

const FacultyPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IFaculty | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const depts = await apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []);

      if (isDeptHead && !isAdmin) {
        const myDept = depts.find(d => d.headId === user?.id);
        if (myDept) {
          const fac = await apiClient.get<IPageResponse<IFaculty>>(`/departments/${myDept.id}/faculty`).then(r => r.data.content ?? []);
          setData({ departments: depts, items: fac });
        } else {
          setData({ departments: depts, items: [] });
        }
      } else {
        setData({ departments: depts, items: await apiClient.get<IPageResponse<IFaculty>>('/faculties').then(r => r.data.content ?? []) });
      }
    } catch (err: unknown) {
      const st = (err as { response?: { status?: number } })?.response?.status;
      if (st !== 404 && st !== 500) toast.error('Failed to load faculty');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => {
    setSelected(null);
    setForm(EMPTY_FORM);
    setModal('create');
  };

  const openEdit = (item: IFaculty) => {
    setSelected(item);
    setForm(f => ({ ...f, departmentId: item.departmentId, position: item.position, status: item.status }));
    setModal('edit');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'edit' && selected) {
        const payload: ICreateFacultyRequest = { userId: selected.userId, position: form.position, departmentId: form.departmentId, status: form.status };
        await apiClient.put(`/faculties/${selected.id}`, payload);
        toast.success('Faculty updated');
      } else {
        // register IAM account, extract userId from the returned token, then create faculty profile
        const authResp = await apiClient.post<{ accessToken: string }>('/auth/register', { name: form.name, email: form.email, password: form.password, phone: form.phone, roles: [Role.FACULTY] }).then(r => r.data);
        const decoded = decodeJwt(authResp.accessToken);
        await apiClient.post('/faculties', { userId: decoded.userId, position: form.position, departmentId: form.departmentId, status: form.status });
        toast.success('Faculty member created');
      }
      setModal(null); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Failed to save faculty');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/faculties/${selected.id}`);
      toast.success('Faculty deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete faculty'); } finally { setSaving(false); }
  };

  const deptHeadIds = new Set(data.departments.map(d => d.headId).filter(Boolean));

  const columns: Column<IFaculty>[] = [
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
    { key: 'departmentId', label: 'Department', render: item => item.departmentName ?? data.departments.find(d => d.id === item.departmentId)?.departmentName ?? '—' },
    { key: 'joinDate',     label: 'Joined', render: item => item.joinDate ? new Date(item.joinDate).toLocaleDateString() : '—' },
    { key: 'status',       label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Faculty"
        subtitle={isDeptHead && !isAdmin ? 'Faculty in your department' : 'Manage faculty members'}
        action={isAdmin ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Faculty</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={isAdmin ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton>
          <Modal.Title>{modal === 'edit' ? 'Edit Faculty' : 'Add Faculty Member'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modal === 'create' && (
            <>
              <p className="text-xs text-tertiary bg-bg-2 p-2.5 rounded mb-3.5">Step 1 — Account credentials</p>
              <div className="grid grid-cols-2 gap-3.5 mb-3.5">
                <div>
                  <label className="form-label">Full Name</label>
                  <input className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3.5 mb-5">
                <div>
                  <label className="form-label">Password</label>
                  <input type="password" className="form-control" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <p className="text-xs text-tertiary bg-bg-2 p-2.5 rounded mb-3.5">Step 2 — Faculty profile</p>
            </>
          )}
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Position</label>
              <input className="form-control" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="e.g. Associate Professor" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select className="form-select" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
              <option value="">Select department</option>
              {data.departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
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

      <DeleteModal show={modal === 'delete'} label={selected?.name} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default FacultyPage;
