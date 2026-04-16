import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsEye } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { AuditStatus, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IAudit, IAuditLog } from '@/types/complianceTypes';

const EMPTY_FORM = { findings: '', auditStatus: AuditStatus.PENDING };
const EMPTY_DATA = { audits: [] as IAudit[], logs: [] as IAuditLog[] };

// audit page covers both compliance audits (review) and system audit logs (admin)
const AuditPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const showLogs = isAdmin; // only admin sees system audit logs tab

  const [tab, setTab] = useState<'audits' | 'logs'>('audits');

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filters, setFilters] = useState({ severity: '' });
  const [auditsLoading, setAuditsLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [reviewModal, setReviewModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<IAudit | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAudits = async () => {
    setAuditsLoading(true);
    try {
      const audits = await apiClient.get<IAudit[]>('/audits').then(r => r.data);
      setData(d => ({ ...d, audits }));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load audits');
    } finally { setAuditsLoading(false); }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const logs = await apiClient.get<IAuditLog[]>('/audit-logs').then(r => r.data);
      setData(d => ({ ...d, logs }));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load audit logs');
    } finally { setLogsLoading(false); }
  };

  useEffect(() => {
    loadAudits();
    if (isAdmin) loadLogs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openReview = (item: IAudit) => {
    setSelectedAudit(item);
    setForm({ findings: item.findings ?? '', auditStatus: item.status });
    setReviewModal(true);
  };

  const handleReview = async () => {
    if (!selectedAudit) return;
    setSaving(true);
    try {
      await apiClient.put(`/audits/${selectedAudit.id}/review`, { findings: form.findings, status: form.auditStatus });
      toast.success('Audit reviewed'); setReviewModal(false); loadAudits();
    } catch { toast.error('Failed to save review'); } finally { setSaving(false); }
  };

  const auditColumns: Column<IAudit>[] = [
    { key: 'entityType', label: 'Entity Type', render: a => formatEnum(a.entityType) },
    { key: 'scope',      label: 'Scope' },
    { key: 'findings',   label: 'Findings', render: a => a.findings ? (a.findings.length > 55 ? a.findings.slice(0, 55) + '…' : a.findings) : '—' },
    { key: 'auditDate',  label: 'Date', render: a => new Date(a.auditDate).toLocaleDateString() },
    { key: 'status',     label: 'Status', render: a => <StatusBadge status={a.status} /> },
  ];

  const filteredLogs = filters.severity ? data.logs.filter(l => l.severity === filters.severity) : data.logs;

  const logColumns: Column<IAuditLog>[] = [
    { key: 'action',    label: 'Action' },
    { key: 'resource',  label: 'Resource' },
    { key: 'logType',   label: 'Type',     render: item => formatEnum(item.logType) },
    { key: 'severity',  label: 'Severity', render: item => <StatusBadge status={item.severity} /> },
    { key: 'details',   label: 'Details',  render: item => item.details ? (item.details.length > 60 ? item.details.slice(0, 60) + '…' : item.details) : '—' },
    { key: 'createdAt', label: 'Timestamp', render: item => item.createdAt ? new Date(item.createdAt).toLocaleString() : '—' },
  ];

  return (
    <>
      <PageHeader
        title="Audits"
        subtitle={tab === 'logs' ? 'System activity log — read only' : 'Review and manage compliance audits'}
      />

      {showLogs && (
        <div className="flex gap-1 mb-5 border-b border-border">
          <button
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'audits' ? 'border-blue text-blue' : 'border-transparent text-secondary hover:text-base'}`}
            onClick={() => setTab('audits')}
          >
            Compliance Audits
          </button>
          <button
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === 'logs' ? 'border-blue text-blue' : 'border-transparent text-secondary hover:text-base'}`}
            onClick={() => setTab('logs')}
          >
            System Audit Logs
          </button>
        </div>
      )}

      {tab === 'audits' && (
        <>
          <DataTable columns={auditColumns} data={data.audits} loading={auditsLoading}
            actions={item => (
              <button className="icon-btn" onClick={() => openReview(item)} title="Review">
                <BsEye size={13} />
              </button>
            )}
          />

          <Modal show={reviewModal} onHide={() => setReviewModal(false)}>
            <Modal.Header closeButton><Modal.Title>Review Audit</Modal.Title></Modal.Header>
            <Modal.Body>
              {selectedAudit && (
                <div className="mb-4 p-3 bg-base rounded text-base flex gap-6">
                  <div><span className="text-secondary">Entity:</span> <strong>{formatEnum(selectedAudit.entityType)}</strong></div>
                  <div><span className="text-secondary">Scope:</span> <strong>{selectedAudit.scope}</strong></div>
                </div>
              )}
              <div className="mb-3.5">
                <label className="form-label">Findings</label>
                <textarea className="form-control" rows={4} value={form.findings} onChange={e => setForm(f => ({ ...f, findings: e.target.value }))} placeholder="Enter audit findings…" />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="form-select" value={form.auditStatus} onChange={e => setForm(f => ({ ...f, auditStatus: e.target.value as AuditStatus }))}>
                  {Object.values(AuditStatus).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </select>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <button className="btn btn-secondary btn-sm" onClick={() => setReviewModal(false)}>Cancel</button>
              <button className="btn btn-primary btn-sm" onClick={handleReview} disabled={saving}>
                {saving && <span className="spinner-border spinner-border-sm me-2" />}Save Review
              </button>
            </Modal.Footer>
          </Modal>
        </>
      )}

      {tab === 'logs' && showLogs && (
        <>
          <div className="flex items-center gap-2.5 mb-4">
            <label className="form-label m-0 whitespace-nowrap">Filter by severity</label>
            <select className="form-select form-select-sm max-w-40" value={filters.severity} onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}>
              <option value="">All</option>
              <option value="INFO">Info</option>
              <option value="WARN">Warn</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <DataTable columns={logColumns} data={filteredLogs} loading={logsLoading} />
        </>
      )}
    </>
  );
};

export default AuditPage;
