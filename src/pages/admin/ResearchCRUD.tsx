import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { facultyService } from '@/services/faculty.service';
import { researchService } from '@/services/research.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProjectStatus } from '@/types/enums';
import type { ResearchProject, Faculty, Student, CreateResearchProjectRequest } from '@/types/academic.types';

export default function ResearchCRUD() {
  const [items, setItems] = useState<ResearchProject[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [title, setTitle] = useState('');
  const [facultyId, setFacultyId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE' as ProjectStatus);
  const [addFacultyId, setAddFacultyId] = useState('');
  const [addStudentId, setAddStudentId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rpData, facData, stuData] = await Promise.all([
        researchService.getAll(),
        facultyService.getAll(),
        studentService.getAll(),
      ]);
      setItems(rpData);
      setFaculties(facData);
      setStudents(stuData);
    } catch {
      toast.error('Failed to load research projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setTitle('');
    setFacultyId('');
    setStartDate('');
    setEndDate('');
    setStatus('ACTIVE' as ProjectStatus);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateResearchProjectRequest = { title, facultyId, facultyMembers: [], students: [], startDate, endDate, status };
      await researchService.create(payload);
      toast.success('Research project created');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to create research project');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await researchService.delete(id);
      toast.success('Research project deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete research project');
    }
  };

  const openAddFaculty = (projectId: string) => {
    setSelectedProjectId(projectId);
    setAddFacultyId('');
    setShowAddFacultyModal(true);
  };

  const handleAddFaculty = async () => {
    try {
      await researchService.addFaculty(selectedProjectId, addFacultyId);
      toast.success('Co-investigator added');
      setShowAddFacultyModal(false);
      fetchData();
    } catch {
      toast.error('Failed to add co-investigator');
    }
  };

  const openAddStudent = (projectId: string) => {
    setSelectedProjectId(projectId);
    setAddStudentId('');
    setShowAddStudentModal(true);
  };

  const handleAddStudent = async () => {
    try {
      await researchService.addStudent(selectedProjectId, addStudentId);
      toast.success('Student added to project');
      setShowAddStudentModal(false);
      fetchData();
    } catch {
      toast.error('Failed to add student');
    }
  };

  const getFacultyName = (id: string) => faculties.find((f) => f.id === id)?.name || '—';

  const columns: Column<ResearchProject>[] = [
    { key: 'title', label: 'Title' },
    {
      key: 'facultyId',
      label: 'Faculty Lead',
      render: (item) => getFacultyName(item.facultyId),
    },
    { key: 'startDate', label: 'Start Date' },
    { key: 'endDate', label: 'End Date' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Research Projects"
        subtitle="Manage research projects"
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
            <Button variant="outline-info" size="sm" onClick={() => openAddFaculty(item.projectID)} title="Add Co-Investigator">
              <BsPlus /> Faculty
            </Button>
            <Button variant="outline-success" size="sm" onClick={() => openAddStudent(item.projectID)} title="Add Student">
              <BsPlus /> Student
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.projectID)}>
              <BsTrash />
            </Button>
          </div>
        )}
      />

      {/* Create Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create Research Project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control value={title} onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Faculty Lead</Form.Label>
              <Form.Select value={facultyId} onChange={(e) => setFacultyId(e.target.value)}>
                <option value="">Select Faculty Lead</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Start Date</Form.Label>
              <Form.Control type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>End Date</Form.Label>
              <Form.Control type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_HOLD">ON_HOLD</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Create</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Faculty Modal */}
      <Modal show={showAddFacultyModal} onHide={() => setShowAddFacultyModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Co-Investigator</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Faculty</Form.Label>
              <Form.Select value={addFacultyId} onChange={(e) => setAddFacultyId(e.target.value)}>
                <option value="">Select Faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddFacultyModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddFaculty}>Add</Button>
        </Modal.Footer>
      </Modal>

      {/* Add Student Modal */}
      <Modal show={showAddStudentModal} onHide={() => setShowAddStudentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add Student</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Student</Form.Label>
              <Form.Select value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)}>
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddStudentModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddStudent}>Add</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
