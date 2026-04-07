import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { studentService } from '@/services/student.service';
import { thesisService } from '@/services/thesis.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ThesisStatus } from '@/types/enums';
import type { Thesis, Student } from '@/types/academic.types';

export default function ThesisSupervision() {
  const [items, setItems] = useState<Thesis[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Thesis | null>(null);

  const [status, setStatus] = useState<ThesisStatus>('IN_PROGRESS' as ThesisStatus);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [thesisRes, stuData] = await Promise.all([
        thesisService.getMy(),
        studentService.getAll(),
      ]);
      setItems(thesisRes);
      setStudents(stuData);
    } catch {
      toast.error('Failed to load theses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openUpdateStatus = (item: Thesis) => {
    setEditItem(item);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleUpdateStatus = async () => {
    try {
      await thesisService.update(editItem!.id!, {
        studentId: editItem!.studentId,
        title: editItem!.title,
        submissionDate: editItem!.submissionDate,
        supervisorId: editItem!.supervisorId,
        status,
      });
      toast.success('Thesis status updated');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to update thesis status');
    }
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '—';

  const columns: Column<Thesis>[] = [
    {
      key: 'studentId',
      label: 'Student',
      render: (item) => getStudentName(item.studentId),
    },
    { key: 'title', label: 'Title' },
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
        title="Thesis Supervision"
        subtitle="Manage theses you supervise"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button variant="outline-primary" size="sm" onClick={() => openUpdateStatus(item)} title="Update Status">
              <BsPencil /> Status
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Update Thesis Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Thesis</Form.Label>
              <Form.Control plaintext readOnly value={editItem?.title || ''} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Student</Form.Label>
              <Form.Control plaintext readOnly value={editItem ? getStudentName(editItem.studentId) : ''} />
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
          <Button variant="primary" onClick={handleUpdateStatus}>Update</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
