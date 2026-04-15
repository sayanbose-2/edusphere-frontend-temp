import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { studentService } from '@/services/student.service';
import { thesisService } from '@/services/thesis.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThesisStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Thesis, Student } from '@/types/academic.types';

export default function ThesisSupervision() {
  const [items, setItems] = useState<Thesis[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Thesis | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<ThesisStatus>(ThesisStatus.SUBMITTED);

  const load = async () => {
    try {
      setLoading(true);
      const [theses, stus] = await Promise.all([thesisService.getMy(), studentService.getAll()]);
      setItems(theses); setStudents(stus);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load theses');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openUpdate = (item: Thesis) => { setSelected(item); setStatus(item.status); setModal(true); };

  const handleUpdate = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await thesisService.update(selected.id!, { studentId: selected.studentId, title: selected.title, submissionDate: selected.submissionDate, supervisorId: selected.supervisorId, status });
      toast.success('Thesis status updated'); setModal(false); load();
    } catch { toast.error('Failed to update thesis status'); }
    finally { setSaving(false); }
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? '—';

  const columns: Column<Thesis>[] = [
    { key: 'studentId',      label: 'Student',    render: item => studentName(item.studentId) },
    { key: 'title',          label: 'Title' },
    { key: 'submissionDate', label: 'Submitted' },
    { key: 'status',         label: 'Status',     render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Thesis Supervision" subtitle="Manage theses you supervise" />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <button className="icon-btn" onClick={() => openUpdate(item)} title="Update status"><BsPencil size={13} /></button>
        )}
      />

      <Modal show={modal} onHide={() => setModal(false)}>
        <Modal.Header closeButton><Modal.Title>Update Thesis Status</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{selected.title}</div>
              <div style={{ color: 'var(--text-2)' }}>Student: {studentName(selected.studentId)}</div>
            </div>
          )}
          <label className="form-label">Status</label>
          <select className="form-select" value={status} onChange={e => setStatus(e.target.value as ThesisStatus)}>
            {Object.values(ThesisStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
          </select>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleUpdate} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Update
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
