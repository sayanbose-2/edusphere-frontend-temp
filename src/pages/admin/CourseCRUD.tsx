import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsCheck, BsX } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { departmentService } from '@/services/department.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Course, Department, CreateCourseRequest } from '@/types/academic.types';

export default function CourseCRUD() {
  const [items, setItems] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Course | null>(null);

  const [title, setTitle] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [credits, setCredits] = useState(0);
  const [duration, setDuration] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseData, deptData] = await Promise.all([
        courseService.getAll(),
        departmentService.getAll(),
      ]);
      setItems(courseData);
      setDepartments(deptData);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setTitle('');
    setDepartmentId('');
    setCredits(0);
    setDuration(0);
    setShowModal(true);
  };

  const openEdit = (item: Course) => {
    setEditItem(item);
    setTitle(item.title);
    setDepartmentId(item.departmentId);
    setCredits(item.credits);
    setDuration(item.duration);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateCourseRequest = { title, departmentId, credits, duration, status: 'ACTIVE' as Status };
      if (editItem) {
        await courseService.update(editItem.id, payload);
        toast.success('Course updated');
      } else {
        await courseService.create(payload);
        toast.success('Course created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save course');
    }
  };

  const handleToggleStatus = async (item: Course) => {
    try {
      const next = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await courseService.updateStatus(item.id, next as import('@/types/enums').Status);
      toast.success(`Course marked ${next.toLowerCase()}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await courseService.delete(id);
      toast.success('Course deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const columns: Column<Course>[] = [
    { key: 'title', label: 'Title' },
    {
      key: 'departmentId',
      label: 'Department',
      render: (item) => departments.find((d) => d.id === item.departmentId)?.departmentName || '-',
    },
    { key: 'credits', label: 'Credits' },
    { key: 'duration', label: 'Duration' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Courses"
        subtitle="Manage courses"
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
            <Button
              variant={item.status === 'ACTIVE' ? 'outline-warning' : 'outline-success'}
              size="sm"
              onClick={() => handleToggleStatus(item)}
              title="Toggle Status"
            >
              {item.status === 'ACTIVE' ? <BsX /> : <BsCheck />}
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
              <BsTrash />
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Course' : 'Create Course'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department</Form.Label>
              <Form.Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.departmentName}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Credits</Form.Label>
              <Form.Control type="number" value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Duration</Form.Label>
              <Form.Control type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
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
