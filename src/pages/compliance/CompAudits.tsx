import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AuditStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Audit, ReviewAuditRequest } from '@/types/compliance.types';

export default function CompAudits() {
  const [items, setItems] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Audit | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [findings, setFindings] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAll();
      setItems(data);
    } catch {
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  const fetchByStatus = async (status: string) => {
    if (!status) {
      fetchData();
      return;
    }
    try {
      setLoading(true);
      const allAudits = await auditService.getAll();
      const filtered = allAudits.filter((a) => a.status === status);
      setItems(filtered);
    } catch {
      toast.error('Failed to filter audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    fetchByStatus(value);
  };

  const openReview = (item: Audit) => {
    setEditItem(item);
    setFindings(item.findings || '');
    setShowModal(true);
  };

  const handleReview = async () => {
    if (!editItem) return;
    try {
      const payload: ReviewAuditRequest = {
        findings,
        status: AuditStatus.COMPLETED,
      };
      await auditService.review(editItem.auditId, payload);
      toast.success('Audit reviewed successfully');
      setShowModal(false);
      setStatusFilter('');
      fetchData();
    } catch {
      toast.error('Failed to review audit');
    }
  };

  const columns: Column<Audit>[] = [
    {
      key: 'entityType',
      label: 'Entity Type',
      render: (item) => formatEnum(item.entityType),
    },
    { key: 'scope', label: 'Scope' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    { key: 'auditDate', label: 'Audit Date' },
    {
      key: 'findings',
      label: 'Findings',
      render: (item) =>
        item.findings
          ? item.findings.length > 60
            ? item.findings.substring(0, 60) + '...'
            : item.findings
          : '—',
    },
  ];

  return (
    <div>
      <PageHeader title="Compliance Audits" subtitle="Review audit records" />

      <div className="mb-3">
        <Form.Group className="d-flex align-items-center gap-2" style={{ maxWidth: 300 }}>
          <Form.Label className="mb-0 small text-nowrap">Filter by Status:</Form.Label>
          <Form.Select
            size="sm"
            value={statusFilter}
            onChange={(e) => handleStatusFilterChange(e.target.value)}
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="FLAGGED">FLAGGED</option>
          </Form.Select>
        </Form.Group>
      </div>

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => openReview(item)}
              title="Review"
            >
              <BsPencil /> Review
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Review Audit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editItem && (
            <div className="mb-3 p-3 rounded" style={{ background: 'var(--bg-raised)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Entity:</strong> {formatEnum(editItem.entityType)}
              <span className="mx-2">|</span>
              <strong>Scope:</strong> {editItem.scope}
              <span className="mx-2">|</span>
              <strong>Date:</strong> {editItem.auditDate}
            </div>
          )}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Findings</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder="Enter your review findings..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleReview}>
            Submit Review
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
