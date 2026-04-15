import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsEye } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { auditService } from '@/services/audit.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Audit } from '@/types/compliance.types';
import { AuditStatus } from '@/types/enums';

export default function AuditList() {
  const [items, setItems] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [selected, setSelected] = useState<Audit | null>(null);
  const [findings, setFindings] = useState('');
  const [status, setStatus] = useState<AuditStatus>(AuditStatus.PENDING);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try { setLoading(true); setItems(await auditService.getAll()); }
    catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load audits');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openReview = (item: Audit) => {
    setSelected(item);
    setFindings(item.findings ?? '');
    setStatus(item.status);
    setModal(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await auditService.review(selected.id, { findings, status });
      toast.success('Audit reviewed');
      setModal(false);
      load();
    } catch { toast.error('Failed to save review'); }
    finally { setSaving(false); }
  };

  const columns: Column<Audit>[] = [
    { key: 'entityType', label: 'Entity Type', render: a => formatEnum(a.entityType) },
    { key: 'scope',      label: 'Scope' },
    { key: 'findings',   label: 'Findings', render: a => a.findings ? (a.findings.length > 55 ? a.findings.slice(0, 55) + '…' : a.findings) : '—' },
    { key: 'auditDate',  label: 'Date', render: a => new Date(a.auditDate).toLocaleDateString() },
    { key: 'status',     label: 'Status', render: a => <StatusBadge status={a.status} /> },
  ];

  return (
    <>
      <PageHeader title="Audits" subtitle="Review and manage compliance audits" />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <button className="icon-btn" onClick={() => openReview(item)} title="Review">
            <BsEye size={13} />
          </button>
        )}
      />

      <Modal show={modal} onHide={() => setModal(false)}>
        <Modal.Header closeButton><Modal.Title>Review Audit</Modal.Title></Modal.Header>
        <Modal.Body>
          {selected && (
            <div className="mb-4 p-3 bg-base rounded text-base flex gap-6">
              <div><span className="text-secondary">Entity:</span> <strong>{formatEnum(selected.entityType)}</strong></div>
              <div><span className="text-secondary">Scope:</span> <strong>{selected.scope}</strong></div>
            </div>
          )}
          <div className="mb-3.5">
            <label className="form-label">Findings</label>
            <textarea className="form-control" rows={4} value={findings} onChange={e => setFindings(e.target.value)} placeholder="Enter audit findings…" />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as AuditStatus)}>
              {Object.values(AuditStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save Review
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
