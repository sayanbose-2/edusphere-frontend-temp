import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { reportService } from '@/services/report.service';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Status } from '@/types/enums';
import type { Department } from '@/types/academic.types';
import type { Report, CreateReportRequest } from '@/types/compliance.types';

export default function DeptReports() {
  const { user } = useAuth();
  const [items, setItems] = useState<Report[]>([]);
  const [myDept, setMyDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [scope, setScope] = useState('');
  const [metrics, setMetrics] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);

  const fetchData = async () => {
    try {
      setLoading(true);
      const allDepts = await departmentService.getAll();

      const found = allDepts.find((d) => d.headId === user?.id);
      setMyDept(found || null);

      let reports;
      if (found) {
        try {
          reports = await reportService.getByDepartment(found.id);
        } catch {
          reports = await reportService.getAll();
        }
      } else {
        reports = await reportService.getAll();
      }
      setItems(reports);
    } catch {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setScope('');
    setMetrics('');
    setStatus('ACTIVE' as Status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateReportRequest = {
        generatedBy: user?.id || '',
        departmentId: myDept?.id || '',
        scope: scope as import('@/types/enums').ReportScope,
        metrics,
        status,
      };
      await reportService.create(payload);
      toast.success('Report created');
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to create report');
    }
  };

  const columns: Column<Report>[] = [
    { key: 'scope', label: 'Scope' },
    {
      key: 'department',
      label: 'Department',
      render: (item) => String(item.department || '-'),
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (item) => item.metrics.length > 60 ? item.metrics.substring(0, 60) + '...' : item.metrics,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={myDept ? `Reports for ${myDept.departmentName}` : 'Department reports'}
        action={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <BsPlus className="me-1" /> Create Report
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Create Report</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Scope</Form.Label>
              <Form.Select value={scope} onChange={(e) => setScope(e.target.value)}>
                <option value="">Select Scope</option>
                <option value="DEPARTMENT">DEPARTMENT</option>
                <option value="INSTITUTION">INSTITUTION</option>
                <option value="FINANCIAL">FINANCIAL</option>
                <option value="COMPLIANCE">COMPLIANCE</option>
                <option value="ACADEMIC">ACADEMIC</option>
                <option value="RESEARCH">RESEARCH</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Metrics</Form.Label>
              <Form.Control as="textarea" rows={5} value={metrics} onChange={(e) => setMetrics(e.target.value)} />
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
          <Button variant="primary" onClick={handleSubmit}>Create</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
