import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { facultyService } from '@/services/faculty.service';
import { workloadService } from '@/services/workload.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Workload, Faculty, Course, CreateWorkloadRequest } from '@/types/academic.types';

export default function WorkloadCRUD() {
  const [items, setItems] = useState<Workload[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Workload | null>(null);

  const [facultyId, setFacultyId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [hours, setHours] = useState(0);
  const [semester, setSemester] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [wlData, facData, courseData] = await Promise.all([
        workloadService.getAll(),
        facultyService.getAll(),
        courseService.getAll(),
      ]);
      setItems(wlData);
      setFaculties(facData);
      setCourses(courseData);
    } catch {
      toast.error('Failed to load workloads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setFacultyId('');
    setCourseId('');
    setHours(0);
    setSemester('');
    setStatus('ACTIVE' as Status);
    setShowModal(true);
  };

  const openEdit = (item: Workload) => {
    setEditItem(item);
    setFacultyId(item.facultyId);
    setCourseId(item.courseId);
    setHours(item.hours);
    setSemester(item.semester);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateWorkloadRequest = { facultyId, courseId, hours, semester, status };
      if (editItem) {
        await workloadService.update(editItem.id!, payload);
        toast.success('Workload updated');
      } else {
        await workloadService.create(payload);
        toast.success('Workload created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save workload');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await workloadService.delete(id);
      toast.success('Workload deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete workload');
    }
  };

  const getFacultyName = (id: string) => faculties.find((f) => f.id === id)?.name || '—';
  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.title || '—';

  const columns: Column<Workload>[] = [
    {
      key: 'facultyId',
      label: 'Faculty',
      render: (item) => getFacultyName(item.facultyId),
    },
    {
      key: 'courseId',
      label: 'Course',
      render: (item) => getCourseName(item.courseId),
    },
    { key: 'hours', label: 'Hours' },
    { key: 'semester', label: 'Semester' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Workloads"
        subtitle="Manage faculty workloads"
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

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Workload' : 'Create Workload'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Faculty</Form.Label>
              <Form.Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                <option value="">Select Faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
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
              <Form.Label>Hours</Form.Label>
              <Form.Control type="number" value={hours} onChange={(e) => setHours(Number(e.target.value))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Semester</Form.Label>
              <Form.Control value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="e.g. Fall 2025" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
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
