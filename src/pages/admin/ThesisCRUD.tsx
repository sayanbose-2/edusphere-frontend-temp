import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { studentService } from '@/services/student.service';
import { thesisService } from '@/services/thesis.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThesisStatus } from '@/types/enums';
import type { Thesis, Student, Faculty, CreateThesisRequest } from '@/types/academic.types';

export default function ThesisCRUD() {
  const [items, setItems] = useState<Thesis[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Thesis | null>(null);

  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [status, setStatus] = useState<ThesisStatus>('IN_PROGRESS' as ThesisStatus);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [thesisData, stuData, facData] = await Promise.all([
        thesisService.getAll(),
        studentService.getAll(),
        facultyService.getAll(),
      ]);
      setItems(thesisData);
      setStudents(stuData);
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
    setEditItem(null);
    setStudentId('');
    setTitle('');
    setSubmissionDate('');
    setSupervisorId('');
    setStatus('IN_PROGRESS' as ThesisStatus);
    setShowModal(true);
  };

  const openEdit = (item: Thesis) => {
    setEditItem(item);
    setStudentId(item.studentId);
    setTitle(item.title);
    setSubmissionDate(item.submissionDate);
    setSupervisorId(item.supervisorId);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateThesisRequest = { studentId, title, submissionDate, supervisorId, status };
      if (editItem) {
        await thesisService.update(editItem.id!, payload);
        toast.success('Thesis updated');
      } else {
        await thesisService.create(payload);
        toast.success('Thesis created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save thesis');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await thesisService.delete(id);
      toast.success('Thesis deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete thesis');
    }
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '—';
  const getFacultyName = (id: string) => faculties.find((f) => f.id === id)?.name || '—';

  const columns: Column<Thesis>[] = [
    {
      key: 'studentId',
      label: 'Student',
      render: (item) => getStudentName(item.studentId),
    },
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
        title="Theses"
        subtitle="Manage student theses"
        action={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <BsPlus className="me-1" /> Add New
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button variant="outline-primary" size="sm" onClick={() => openEdit(item)} disabled={!item.id}>
              <BsPencil />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id!)} disabled={!item.id}>
              <BsTrash />
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Thesis' : 'Create Thesis'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Student</Form.Label>
              <Form.Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Submission Date</Form.Label>
              <Form.Control type="date" value={submissionDate} onChange={(e) => setSubmissionDate(e.target.value)} />
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
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as ThesisStatus)}>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
