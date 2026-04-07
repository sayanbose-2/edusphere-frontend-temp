import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { facultyService } from '@/services/faculty.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Department, CreateDepartmentRequest, Faculty } from '@/types/academic.types';

export default function DepartmentCRUD() {
  const [items, setItems] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);
  const [headId, setHeadId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deptData, facData] = await Promise.all([
        departmentService.getAll(),
        facultyService.getAll(),
      ]);
      setItems(deptData);
      setFaculties(facData);
    } catch {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setDepartmentName('');
    setDepartmentCode('');
    setContactInfo('');
    setStatus('ACTIVE' as Status);
    setShowModal(true);
  };

  const openEdit = (item: Department) => {
    setEditItem(item);
    setDepartmentName(item.departmentName);
    setDepartmentCode(item.departmentCode);
    setContactInfo(item.contactInfo);
    setStatus(item.status);
    setShowModal(true);
  };

  const openAssignHead = (deptId: string) => {
    setSelectedDeptId(deptId);
    setHeadId('');
    setShowHeadModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateDepartmentRequest = { departmentName, departmentCode, contactInfo, status };
      if (editItem) {
        await departmentService.update(editItem.id, payload);
        toast.success('Department updated');
      } else {
        await departmentService.create(payload);
        toast.success('Department created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save department');
    }
  };

  const handleAssignHead = async () => {
    try {
      await departmentService.assignHead(selectedDeptId, headId);
      toast.success('Department head assigned');
      setShowHeadModal(false);
      fetchData();
    } catch {
      toast.error('Failed to assign department head');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await departmentService.delete(id);
      toast.success('Department deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete department');
    }
  };

  const columns: Column<Department>[] = [
    { key: 'departmentName', label: 'Department Name' },
    { key: 'departmentCode', label: 'Code' },
    { key: 'contactInfo', label: 'Contact Info' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'headName',
      label: 'Department Head',
      render: (item) => item.headName || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage departments"
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
            <Button variant="outline-info" size="sm" onClick={() => openAssignHead(item.id)} title="Assign Head">
              <BsPlus />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id)}>
              <BsTrash />
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Department' : 'Create Department'}</Modal.Title>
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
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showHeadModal} onHide={() => setShowHeadModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Assign Department Head</Modal.Title>
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
