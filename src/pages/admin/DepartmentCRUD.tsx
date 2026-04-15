import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsPersonCheck } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { userService } from '@/services/user.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Role, Status } from '@/types/enums';
import type { Column } from '@/components/ui/DataTable';
import type { Department, CreateDepartmentRequest, Faculty } from '@/types/academic.types';

type ModalMode = 'create' | 'edit' | 'delete' | 'assign' | null;

export default function DepartmentCRUD() {
  const [items, setItems] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);

  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState<Status>(Status.ACTIVE);
  const [headId, setHeadId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [d, f] = await Promise.all([departmentService.getAll(), facultyService.getAll()]);
      setItems(d); setFaculties(f);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load departments');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setDepartmentName(''); setDepartmentCode(''); setContactInfo(''); setStatus(Status.ACTIVE); setModal('create'); };
  const openEdit = (item: Department) => { setSelected(item); setDepartmentName(item.departmentName); setDepartmentCode(item.departmentCode); setContactInfo(item.contactInfo); setStatus(item.status); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: CreateDepartmentRequest = { departmentName, departmentCode, contactInfo, status };
      if (modal === 'edit' && selected) { await departmentService.update(selected.id, payload); toast.success('Department updated'); }
      else { await departmentService.create(payload); toast.success('Department created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save department'); }
    finally { setSaving(false); }
  };

  const handleAssignHead = async () => {
    if (!selected || !headId) { toast.error('Select a faculty member'); return; }
    setSaving(true);
    try {
      // Step 1: Set headId on the department in faculty-service
      await departmentService.assignHead(selected.id, headId);

      // Step 2: Grant DEPARTMENT_HEAD role to the new head in IAM
      const newHead = faculties.find(f => f.id === headId);
      if (newHead) {
        await userService.updateRoles(newHead.userId, [Role.FACULTY, Role.DEPARTMENT_HEAD], true);
      }

      // Step 3: Remove DEPARTMENT_HEAD role from the previous head (if any and different)
      if (selected.headId && selected.headId !== headId) {
        const prevHead = faculties.find(f => f.id === selected.headId);
        if (prevHead) {
          await userService.updateRoles(prevHead.userId, [Role.FACULTY], true);
        }
      }

      toast.success('Department head assigned');
      setModal(null);
      load();
    } catch { toast.error('Failed to assign head'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await departmentService.delete(selected.id); toast.success('Department deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete department'); }
    finally { setSaving(false); }
  };

  const columns: Column<Department>[] = [
    { key: 'departmentName', label: 'Name' },
    { key: 'departmentCode', label: 'Code' },
    { key: 'contactInfo',    label: 'Contact' },
    { key: 'headName',       label: 'Head', render: item => {
      const name = item.headName ?? faculties.find(f => f.id === item.headId)?.name;
      return name ?? '—';
    }},
    { key: 'status',         label: 'Status', render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Departments" subtitle="Manage academic departments"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Department</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-success" onClick={() => { setSelected(item); setHeadId(''); setModal('assign'); }} title="Assign Head"><BsPersonCheck size={14} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Department' : 'New Department'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Department Name</label>
            <input className="form-control" value={departmentName} onChange={e => setDepartmentName(e.target.value)} placeholder="e.g. Computer Science" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Department Code</label>
            <input className="form-control" value={departmentCode} onChange={e => setDepartmentCode(e.target.value)} placeholder="e.g. CS" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Contact Info</label>
            <input className="form-control" value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="Email or phone" />
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

      <Modal show={modal === 'assign'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Assign Department Head</Modal.Title></Modal.Header>
        <Modal.Body>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 14 }}>Assign head for <strong>{selected?.departmentName}</strong></p>
          <label className="form-label">Select Faculty</label>
          <select className="form-select" value={headId} onChange={e => setHeadId(e.target.value)}>
            <option value="">Select faculty member</option>
            {faculties.filter(f => f.departmentId === selected?.id).map(f => (
              <option key={f.id} value={f.id}>{f.name}{f.id === selected?.headId ? ' (current head)' : ''}</option>
            ))}
          </select>
          {faculties.filter(f => f.departmentId === selected?.id).length === 0 && (
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 8 }}>No faculty members in this department yet. Add faculty first.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleAssignHead} disabled={saving}>Assign</button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete "{selected?.departmentName}"?</p>
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
