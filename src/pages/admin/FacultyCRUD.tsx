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
import type { Faculty, Department, CreateFacultyRequest } from '@/types/academic.types';

export default function FacultyCRUD() {
  const [items, setItems] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Faculty | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [position, setPosition] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facData, deptData] = await Promise.all([
        facultyService.getAll(),
        departmentService.getAll(),
      ]);
      setItems(facData);
      setDepartments(deptData);
    } catch {
      toast.error('Failed to load faculties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setName('');
    setEmail('');
    setPassword('');
    setPhone('');
    setDepartmentId('');
    setPosition('');
    setStatus('ACTIVE' as Status);
    setShowModal(true);
  };

  const openEdit = (item: Faculty) => {
    setEditItem(item);
    setName(item.name);
    setEmail(item.email);
    setPassword('');
    setPhone(item.phone);
    setDepartmentId(item.departmentId);
    setPosition(item.position);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await facultyService.update(editItem.id, { name, email, phone, departmentId, position, status });
        toast.success('Faculty updated');
      } else {
        const payload: CreateFacultyRequest = { name, email, password, phone, departmentId, position, status };
        await facultyService.create(payload);
        toast.success('Faculty created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save faculty');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await facultyService.delete(id);
      toast.success('Faculty deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete faculty');
    }
  };

  const columns: Column<Faculty>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'position', label: 'Position' },
    {
      key: 'departmentId',
      label: 'Department',
      render: (item) => {
        const dept = departments.find((d) => d.id === item.departmentId);
        return dept?.departmentName || item.departmentName || '—';
      },
    },
    { key: 'joinDate', label: 'Join Date' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Faculty"
        subtitle="Manage faculty members"
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
          <Modal.Title>{editItem ? 'Edit Faculty' : 'Create Faculty'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </Form.Group>
            {!editItem && (
              <Form.Group className="mb-3">
                <Form.Label>Password</Form.Label>
                <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={phone} onChange={(e) => setPhone(e.target.value)} />
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
              <Form.Label>Position</Form.Label>
              <Form.Control value={position} onChange={(e) => setPosition(e.target.value)} />
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
