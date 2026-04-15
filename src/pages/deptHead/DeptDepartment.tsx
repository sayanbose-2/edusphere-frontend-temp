import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsPersonPlus, BsBuilding } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Department, CreateDepartmentRequest, Faculty } from '@/types/academic.types';

type ModalMode = 'edit' | 'assignHead' | null;

export default function DeptDepartment() {
  const { user } = useAuth();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [myDept, setMyDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [saving, setSaving] = useState(false);

  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);
  const [headId, setHeadId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [allDepts, facData] = await Promise.all([departmentService.getAll(), facultyService.getAll()]);
      setFaculties(facData);
      setMyDept(allDepts.find(d => d.headId === user?.id) || null);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load department data');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openEdit = () => {
    if (!myDept) return;
    setDepartmentName(myDept.departmentName); setDepartmentCode(myDept.departmentCode);
    setContactInfo(myDept.contactInfo); setStatus(myDept.status);
    setModal('edit');
  };

  const handleUpdate = async () => {
    if (!myDept) return;
    setSaving(true);
    try {
      const payload: CreateDepartmentRequest = { departmentName, departmentCode, contactInfo, status };
      await departmentService.update(myDept.id, payload);
      toast.success('Department updated'); setModal(null); load();
    } catch { toast.error('Failed to update department'); }
    finally { setSaving(false); }
  };

  const handleAssignHead = async () => {
    if (!myDept) return;
    setSaving(true);
    try {
      await departmentService.assignHead(myDept.id, headId);
      toast.success('Department head updated'); setModal(null); load();
    } catch { toast.error('Failed to assign department head'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="My Department" subtitle="Department details" />
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <span className="spinner-border" style={{ color: 'var(--blue)' }} />
        </div>
      </>
    );
  }

  if (!myDept) {
    return (
      <>
        <PageHeader title="My Department" subtitle="Department details" />
        <div style={{ textAlign: 'center', color: 'var(--text-2)', padding: '48px 0', fontSize: 14 }}>
          No department is currently assigned to you.
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Department" subtitle="View and manage your department"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline-primary btn-sm" onClick={openEdit}><BsPencil className="me-1" />Edit</button>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => { setHeadId(''); setModal('assignHead'); }}><BsPersonPlus className="me-1" />Change Head</button>
          </div>
        }
      />

      <div style={{ maxWidth: 640, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <BsBuilding size={22} style={{ color: 'var(--blue)' }} />
          <span style={{ fontSize: 17, fontWeight: 700 }}>{myDept.departmentName}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {[
            { label: 'Department Code', value: myDept.departmentCode },
            { label: 'Status', value: <StatusBadge status={myDept.status} /> },
            { label: 'Contact Info', value: myDept.contactInfo || '—' },
            { label: 'Department Head', value: myDept.headName || '—' },
            { label: 'Created', value: new Date(myDept.createdAt).toLocaleDateString() },
            { label: 'Last Updated', value: new Date(myDept.updatedAt).toLocaleDateString() },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <Modal show={modal === 'edit'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Edit Department</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Department Name</label>
            <input className="form-control" value={departmentName} onChange={e => setDepartmentName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Department Code</label>
            <input className="form-control" value={departmentCode} onChange={e => setDepartmentCode(e.target.value)} />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Contact Info</label>
            <input className="form-control" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
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
          <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'assignHead'} onHide={() => setModal(null)}>
        <Modal.Header closeButton><Modal.Title>Change Department Head</Modal.Title></Modal.Header>
        <Modal.Body>
          <label className="form-label">Select Faculty</label>
          <select className="form-select" value={headId} onChange={e => setHeadId(e.target.value)}>
            <option value="">Select faculty</option>
            {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleAssignHead} disabled={saving || !headId}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Assign
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
