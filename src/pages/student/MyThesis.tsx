import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { studentService } from '@/services/student.service';
import { thesisService } from '@/services/thesis.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Thesis, Faculty, CreateThesisRequest } from '@/types/academic.types';
import type { ThesisStatus } from '@/types/enums';

export default function MyThesis() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [myStudentId, setMyStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [thesisData, me] = await Promise.all([thesisService.getMy(), studentService.getMe()]);
      setTheses(thesisData); setMyStudentId(me.id);
      // Faculty list is used only for supervisor names — student may not have access, so load separately
      try { const facData = await facultyService.getAll(); setFaculties(facData); } catch { /* student role may lack permission */ }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load theses');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setTitle(''); setSubmissionDate(new Date().toISOString().split('T')[0]); setSupervisorId(''); setModal(true); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload: CreateThesisRequest = { studentId: myStudentId, title, supervisorId, submissionDate, status: 'SUBMITTED' as ThesisStatus };
      await thesisService.create(payload);
      toast.success('Thesis submitted'); setModal(false); load();
    } catch { toast.error('Failed to submit thesis'); }
    finally { setSaving(false); }
  };

  const columns: Column<Thesis>[] = [
    { key: 'title',          label: 'Title' },
    { key: 'supervisorId',   label: 'Supervisor',  render: item => faculties.find(f => f.id === item.supervisorId)?.name ?? '—' },
    { key: 'submissionDate', label: 'Submitted' },
    { key: 'status',         label: 'Status',      render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="My Thesis" subtitle="View and submit your thesis"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Submit New Thesis</button>}
      />
      <DataTable columns={columns} data={theses} loading={loading} />

      <Modal show={modal} onHide={() => setModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Submit New Thesis</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter thesis title" />
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Submission Date</label>
              <input type="date" className="form-control" value={submissionDate} onChange={e => setSubmissionDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Supervisor</label>
              <select className="form-select" value={supervisorId} onChange={e => setSupervisorId(e.target.value)}>
                <option value="">Select supervisor</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Submit
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
