import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsCheck, BsX, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { userService } from '@/services/user.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { User } from '@/types/academic.types';

export default function UserList() {
  const [items, setItems] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<User | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);

  const fetchData = async () => {
    try {
      setLoading(true);
      setItems(await userService.getAll());
    } catch {
      toast.error('Failed to load users');
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
    setPhone('');
    setStatus('ACTIVE' as Status);
    setShowModal(true);
  };

  const openEdit = (item: User) => {
    setEditItem(item);
    setName(item.name);
    setEmail(item.email);
    setPhone(item.phone);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (editItem) {
        await userService.update(editItem.id, { name, phone, status, roles: editItem.roles });
        toast.success('User updated');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save user');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await userService.delete(id);
      toast.success('User deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleStatus = async (item: User) => {
    try {
      const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' as Status : 'ACTIVE' as Status;
      await userService.toggleStatus(item.id, newStatus);
      toast.success('Status toggled');
      fetchData();
    } catch {
      toast.error('Failed to toggle status');
    }
  };

  const columns: Column<User>[] = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (item) => item.roles?.join(', ') || '-',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users"
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
          <Modal.Title>{editItem ? 'Edit User' : 'User Details'}</Modal.Title>
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
            <Form.Group className="mb-3">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={phone} onChange={(e) => setPhone(e.target.value)} />
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
