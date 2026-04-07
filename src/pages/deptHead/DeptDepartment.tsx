import { useState, useEffect } from 'react';
import { Card, Row, Col, Modal, Form, Button, Spinner } from 'react-bootstrap';
import { BsPencil, BsPersonPlus, BsBuilding } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Department, CreateDepartmentRequest, Faculty } from '@/types/academic.types';

export default function DeptDepartment() {
  const { user } = useAuth();
  const [, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [myDept, setMyDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showHeadModal, setShowHeadModal] = useState(false);

  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);
  const [headId, setHeadId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allDepts, facData] = await Promise.all([
        departmentService.getAll(),
        facultyService.getAll(),
      ]);
      setDepartments(allDepts);
      setFaculties(facData);

      const found = allDepts.find((d) => d.headId === user?.id);
      setMyDept(found || null);
    } catch {
      toast.error('Failed to load department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openEdit = () => {
    if (!myDept) return;
    setDepartmentName(myDept.departmentName);
    setDepartmentCode(myDept.departmentCode);
    setContactInfo(myDept.contactInfo);
    setStatus(myDept.status);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!myDept) return;
    try {
      const payload: CreateDepartmentRequest = { departmentName, departmentCode, contactInfo, status };
      await departmentService.update(myDept.id, payload);
      toast.success('Department updated');
      setShowEditModal(false);
      fetchData();
    } catch {
      toast.error('Failed to update department');
    }
  };

  const openAssignHead = () => {
    setHeadId('');
    setShowHeadModal(true);
  };

  const handleAssignHead = async () => {
    if (!myDept) return;
    try {
      await departmentService.assignHead(myDept.id, headId);
      toast.success('Department head updated');
      setShowHeadModal(false);
      fetchData();
    } catch {
      toast.error('Failed to assign department head');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!myDept) {
    return (
      <div>
        <PageHeader title="My Department" subtitle="Department details" />
        <div className="text-center text-muted py-5">
          No department is currently assigned to you.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My Department"
        subtitle="View and manage your department"
        action={
          <div className="d-flex gap-2">
            <Button variant="outline-primary" size="sm" onClick={openEdit}>
              <BsPencil className="me-1" /> Edit
            </Button>
            <Button variant="outline-info" size="sm" onClick={openAssignHead}>
              <BsPersonPlus className="me-1" /> Change Head
            </Button>
          </div>
        }
      />

      <Row className="g-4">
        <Col md={8}>
          <Card>
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <BsBuilding size={24} className="text-primary me-2" />
                <h5 className="mb-0 fw-bold">{myDept.departmentName}</h5>
              </div>
              <Row className="g-3">
                <Col sm={6}>
                  <small className="text-muted d-block">Department Code</small>
                  <span className="fw-semibold">{myDept.departmentCode}</span>
                </Col>
                <Col sm={6}>
                  <small className="text-muted d-block">Status</small>
                  <StatusBadge status={myDept.status} />
                </Col>
                <Col sm={6}>
                  <small className="text-muted d-block">Contact Info</small>
                  <span>{myDept.contactInfo || '-'}</span>
                </Col>
                <Col sm={6}>
                  <small className="text-muted d-block">Department Head</small>
                  <span className="fw-semibold">{myDept.headName || '-'}</span>
                </Col>
                <Col sm={6}>
                  <small className="text-muted d-block">Created At</small>
                  <span>{new Date(myDept.createdAt).toLocaleDateString()}</span>
                </Col>
                <Col sm={6}>
                  <small className="text-muted d-block">Last Updated</small>
                  <span>{new Date(myDept.updatedAt).toLocaleDateString()}</span>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Edit Department Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Department</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Department Name</Form.Label>
              <Form.Control value={departmentName} onChange={(e) => setDepartmentName(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Department Code</Form.Label>
              <Form.Control value={departmentCode} onChange={(e) => setDepartmentCode(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Contact Info</Form.Label>
              <Form.Control value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} />
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
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleUpdate}>Save</Button>
        </Modal.Footer>
      </Modal>

      {/* Assign Head Modal */}
      <Modal show={showHeadModal} onHide={() => setShowHeadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Change Department Head</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Select Faculty</Form.Label>
              <Form.Select value={headId} onChange={(e) => setHeadId(e.target.value)}>
                <option value="">Select Faculty</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHeadModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAssignHead}>Assign</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
