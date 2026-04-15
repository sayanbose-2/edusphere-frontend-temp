import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDashCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { reportService } from '@/services/report.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { Status, ReportScope } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { Department } from '@/types/academic.types';
import type { Report, CreateReportRequest } from '@/types/compliance.types';

type ModalMode = 'create' | 'edit' | 'delete' | null;
type MetricRow = { key: string; value: string };

const parseMetrics = (json: string): MetricRow[] => {
  try { const o = JSON.parse(json); if (o && typeof o === 'object') return Object.entries(o).map(([k, v]) => ({ key: k, value: String(v) })); } catch {}
  return [{ key: '', value: '' }];
};
const serializeMetrics = (rows: MetricRow[]) => JSON.stringify(Object.fromEntries(rows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value])));

export default function ReportCRUD() {
  const { user } = useAuth();
  const [items, setItems] = useState<Report[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);

  const [departmentId, setDepartmentId] = useState('');
  const [scope, setScope] = useState<string>(ReportScope.DEPARTMENT);
  const [metricRows, setMetricRows] = useState<MetricRow[]>([{ key: '', value: '' }]);
  const [status, setStatus] = useState<Status>(Status.ACTIVE);

  const load = async () => {
    try {
      setLoading(true);
      const [r, d] = await Promise.all([reportService.getAll(), departmentService.getAll()]);
      setItems(r); setDepartments(d);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load reports');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setSelected(null); setDepartmentId(''); setScope(ReportScope.DEPARTMENT); setMetricRows([{ key: '', value: '' }]); setStatus(Status.ACTIVE); setModal('create'); };
  const openEdit = (item: Report) => { setSelected(item); setDepartmentId(String(item.department || '')); setScope(item.scope); setMetricRows(parseMetrics(item.metrics)); setStatus(item.status); setModal('edit'); };

  const handleSave = async () => {
    if (!scope) { toast.error('Select a scope'); return; }
    if (!departmentId) { toast.error('Select a department'); return; }
    if (metricRows.filter(r => r.key.trim()).length === 0) { toast.error('Add at least one metric'); return; }
    setSaving(true);
    try {
      const payload: CreateReportRequest = { generatedBy: user?.id || '', departmentId, scope: scope as ReportScope, metrics: serializeMetrics(metricRows), status };
      if (modal === 'edit' && selected) { await reportService.update(selected.id, payload); toast.success('Report updated'); }
      else { await reportService.create(payload); toast.success('Report created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save report'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await reportService.delete(selected.id); toast.success('Report deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete report'); }
    finally { setSaving(false); }
  };

  const deptName = (id: string) => departments.find(d => d.id === id)?.departmentName ?? '—';
  const updRow = (i: number, f: keyof MetricRow, v: string) => setMetricRows(r => r.map((x, idx) => idx === i ? { ...x, [f]: v } : x));

  const renderMetrics = (json: string) => {
    try {
      const o = JSON.parse(json);
      if (o && typeof o === 'object') {
        const entries = Object.entries(o);
        return entries.length ? (
          <div className="flex flex-wrap gap-1">
            {entries.map(([k, v]) => <span key={k} className="text-xs bg-bg border border-border rounded px-2 py-0.5 text-secondary">{k}: <strong className="text-base">{String(v)}</strong></span>)}
          </div>
        ) : <span className="text-tertiary">—</span>;
      }
    } catch {}
    return <span className="text-tertiary">—</span>;
  };

  const columns: Column<Report>[] = [
    { key: 'scope',       label: 'Scope',      render: item => formatEnum(item.scope) },
    { key: 'department',  label: 'Department', render: item => deptName(String(item.department || '')) },
    { key: 'generatedBy', label: 'Generated By', render: item => { const g = item.generatedBy; return g && typeof g === 'object' && 'name' in g ? (g as { name: string }).name : String(g || '—'); } },
    { key: 'metrics',     label: 'Metrics',    render: item => renderMetrics(item.metrics) },
    { key: 'status',      label: 'Status',     render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle="Generate and manage institutional reports"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />New Report</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Report' : 'New Report'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <div>
              <label className="form-label">Scope</label>
              <select className="form-select" value={scope} onChange={e => setScope(e.target.value)}>
                {Object.values(ReportScope).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <select className="form-select" value={departmentId} onChange={e => setDepartmentId(e.target.value)}>
                <option value="">Select department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
              </select>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 mb-4 bg-bg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Metrics</span>
              <span className="text-xs text-secondary">{metricRows.filter(r => r.key.trim()).length} entries</span>
            </div>
            {metricRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-2 items-center">
                <input className="form-control" placeholder="Metric name" value={row.key} onChange={e => updRow(i, 'key', e.target.value)} />
                <input className="form-control" placeholder="Value" value={row.value} onChange={e => updRow(i, 'value', e.target.value)} />
                <button className="icon-btn icon-btn-danger" onClick={() => setMetricRows(r => r.filter((_, idx) => idx !== i))} disabled={metricRows.length === 1}><BsDashCircle size={13} /></button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setMetricRows(r => [...r, { key: '', value: '' }])}><BsPlus className="me-1" />Add Metric</button>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={status} onChange={e => setStatus(e.target.value as Status)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Save
          </button>
        </Modal.Footer>
      </Modal>

      <Modal show={modal === 'delete'} onHide={() => setModal(null)} size="sm">
        <Modal.Body className="p-7 text-center">
          <p className="font-semibold mb-1.5">Delete this report?</p>
          <p className="text-xs text-secondary mb-6">This cannot be undone.</p>
          <div className="flex gap-2 justify-center">
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
