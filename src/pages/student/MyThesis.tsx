import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { thesisService } from '@/services/thesis.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Thesis, Faculty, CreateThesisRequest } from '@/types/academic.types';

export default function MyThesis() {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [supervisorId, setSupervisorId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [thesisData, facData] = await Promise.all([
        thesisService.getMy(),
        facultyService.getAll(),
      ]);
      setTheses(thesisData);
      setFaculties(facData);
    } catch {
      toast.error('Failed to load theses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setTitle('');
    setSubmissionDate(new Date().toISOString().split('T')[0]);
    setSupervisorId('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateThesisRequest = {
        title,
        supervisorId,
        submissionDate,
        status: 'SUBMITTED' as import('@/types/enums').ThesisStatus,
      };
      await thesisService.create(payload);
      toast.success('Thesis submitted successfully');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to submit thesis');
    }
  };

  const getFacultyName = (id: string) => faculties.find((f) => f.id === id)?.name || '—';

  const columns: Column<Thesis>[] = [
    { key: 'title', label: 'Title' },
    {
      key: 'supervisorId',
      label: 'Supervisor',
      render: (item) => getFacultyName(item.supervisorId),
    },
    { key: 'submissionDate', label: 'Submission Date' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Thesis"
        subtitle="View and submit your thesis"
        action={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <BsPlus className="me-1" /> Submit New Thesis
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={theses}
        loading={loading}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Submit New Thesis</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter thesis title"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Submission Date</Form.Label>
              <Form.Control
                type="date"
                value={submissionDate}
                onChange={(e) => setSubmissionDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Supervisor</Form.Label>
              <Form.Select value={supervisorId} onChange={(e) => setSupervisorId(e.target.value)}>
                <option value="">Select Supervisor</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Submit</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
