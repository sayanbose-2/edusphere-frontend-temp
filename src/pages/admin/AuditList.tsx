import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AuditStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Audit, ReviewAuditRequest } from '@/types/compliance.types';

export default function AuditList() {
  const [items, setItems] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Audit | null>(null);

  const [findings, setFindings] = useState('');
  const [status, setStatus] = useState<AuditStatus>('PENDING' as AuditStatus);

  const fetchData = async () => {
    try {
      setLoading(true);
      setItems(await auditService.getAll());
    } catch {
      toast.error('Failed to load audits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openReview = (item: Audit) => {
    setEditItem(item);
    setFindings(item.findings || '');
    setStatus(item.status);
    setShowModal(true);
  };

  const handleReview = async () => {
    if (!editItem) return;
    try {
      const payload: ReviewAuditRequest = {
        findings,
        status,
      };
      await auditService.review(editItem.auditId, payload);
      toast.success('Audit reviewed');
      setShowModal(false);
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
      render: (item) => item.findings ? (item.findings.length > 60 ? item.findings.substring(0, 60) + '...' : item.findings) : '—',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audits"
        subtitle="Review audit records"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button variant="outline-primary" size="sm" onClick={() => openReview(item)} title="Review">
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
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Findings</Form.Label>
              <Form.Control as="textarea" rows={5} value={findings} onChange={(e) => setFindings(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as AuditStatus)}>
                <option value="PENDING">PENDING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FLAGGED">FLAGGED</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleReview}>Submit Review</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
