import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ExamType, Status } from '@/types/enums';
import type { Exam, Course, CreateExamRequest } from '@/types/academic.types';

export default function ExamCRUD() {
  const [items, setItems] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Exam | null>(null);

  const [courseId, setCourseId] = useState('');
  const [type, setType] = useState<ExamType>('MIDTERM' as ExamType);
  const [date, setDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examData, courseData] = await Promise.all([
        examService.getAll(),
        courseService.getAll(),
      ]);
      setItems(examData);
      setCourses(courseData);
    } catch {
      toast.error('Failed to load exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setCourseId('');
    setType('MIDTERM' as ExamType);
    setDate('');
    setShowModal(true);
  };

  const openEdit = (item: Exam) => {
    setEditItem(item);
    setCourseId(item.courseId);
    setType(item.type);
    setDate(item.date);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateExamRequest = { courseId, type, date, status: 'ACTIVE' as Status };
      if (editItem) {
        await examService.update(editItem.id, payload);
        toast.success('Exam updated');
      } else {
        await examService.create(payload);
        toast.success('Exam created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save exam');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await examService.delete(id);
      toast.success('Exam deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.title || '—';

  const columns: Column<Exam>[] = [
    {
      key: 'courseId',
      label: 'Course',
      render: (item) => getCourseName(item.courseId),
    },
    {
      key: 'type',
      label: 'Type',
      render: (item) => <StatusBadge status={item.type} />,
    },
    { key: 'date', label: 'Date' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Exams"
        subtitle="Manage examinations"
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
            <Button variant="outline-primary" size="sm" onClick={() => openEdit(item)}>
              <BsPencil />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
              <BsTrash />
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Exam' : 'Create Exam'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select value={type} onChange={(e) => setType(e.target.value as ExamType)}>
                <option value="MIDTERM">MIDTERM</option>
                <option value="FINAL">FINAL</option>
                <option value="QUIZ">QUIZ</option>
                <option value="ASSIGNMENT">ASSIGNMENT</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
