import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
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
  const [allItems, setAllItems] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Audit | null>(null);
  const [saving, setSaving] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [findings, setFindings] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await auditService.getAll();
      setAllItems(data);
      setItems(data);
    } catch { toast.error('Failed to load audits'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    setItems(value ? allItems.filter(a => a.status === value) : allItems);
  };

  const openReview = (item: Audit) => { setSelected(item); setFindings(item.findings || ''); setModal(true); };

  const handleReview = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload: ReviewAuditRequest = { findings, status: AuditStatus.COMPLETED };
      await auditService.review(selected.auditId, payload);
      toast.success('Audit reviewed');
      setModal(false);
      setStatusFilter('');
      load();
    } catch { toast.error('Failed to review audit'); }
    finally { setSaving(false); }
  };

  const columns: Column<Audit>[] = [
    { key: 'entityType', label: 'Entity Type', render: item => formatEnum(item.entityType) },
    { key: 'scope',      label: 'Scope' },
    { key: 'status',     label: 'Status', render: item => <StatusBadge status={item.status} /> },
    { key: 'auditDate',  label: 'Audit Date' },
    { key: 'findings',   label: 'Findings', render: item => item.findings ? (item.findings.length > 60 ? item.findings.slice(0, 60) + '…' : item.findings) : '—' },
  ];

  return (
    <>
      <PageHeader title="Compliance Audits" subtitle="Review audit records" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <label style={{ fontSize: 13, whiteSpace: 'nowrap', color: 'var(--text-2)' }}>Filter by Status:</label>
        <select className="form-select form-select-sm" value={statusFilter} onChange={e => handleFilterChange(e.target.value)} style={{ width: 160 }}>
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="COMPLETED">Completed</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <button className="icon-btn" onClick={() => openReview(item)} title="Review"><BsPencil size={13} /></button>
        )}
      />

      <Modal show={modal} onHide={() => setModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Review Audit</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              <strong>Entity:</strong> {formatEnum(selected.entityType)}
              <span style={{ margin: '0 10px' }}>|</span>
              <strong>Scope:</strong> {selected.scope}
              <span style={{ margin: '0 10px' }}>|</span>
              <strong>Date:</strong> {selected.auditDate}
            </div>
          )}
          <div>
            <label className="form-label">Findings</label>
            <textarea className="form-control" rows={5} value={findings} onChange={e => setFindings(e.target.value)} placeholder="Enter your review findings..." />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleReview} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Submit Review
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
