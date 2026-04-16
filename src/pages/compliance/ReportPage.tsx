import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDashCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { Role, Status, ReportScope } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IReport, ICreateReportRequest } from '@/types/complianceTypes';
import type { IDepartment, IPageResponse } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;
type TMetricRow = { key: string; value: string };

const parseMetrics = (json: string): TMetricRow[] => {
  try {
    const o = JSON.parse(json);
    if (o && typeof o === 'object') return Object.entries(o).map(([k, v]) => ({ key: k, value: String(v) }));
  } catch { /* invalid json — return default */ }
  return [{ key: '', value: '' }];
};

const serializeMetrics = (rows: TMetricRow[]) =>
  JSON.stringify(Object.fromEntries(rows.filter(r => r.key.trim()).map(r => [r.key.trim(), r.value])));

const EMPTY_FORM = { departmentId: '', scope: ReportScope.DEPARTMENT as string, metricRows: [{ key: '', value: '' }] as TMetricRow[], status: Status.ACTIVE as Status };
const EMPTY_DATA = { items: [] as IReport[], departments: [] as IDepartment[] };

const ReportPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;
  const isDeptHead = user?.roles.includes(Role.DEPARTMENT_HEAD) ?? false;

  const canEdit = isAdmin;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IReport | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isDeptHead && !isAdmin) {
        // dept head sees reports for their dept only
        const depts = await apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []);
        const myDept = depts.find(d => d.headId === user?.id);
        const reports = myDept
          ? await apiClient.get<IReport[]>(`/reports/department/${myDept.id}`).then(r => r.data)
          : [];
        setData({ departments: depts, items: reports });
      } else {
        const [r, d] = await Promise.all([
          apiClient.get<IReport[]>('/reports').then(r => r.data),
          apiClient.get<IPageResponse<IDepartment>>('/departments').then(r => r.data.content ?? []),
        ]);
        setData({ items: r, departments: d });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load reports');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setModal('create'); };
  const openEdit = (item: IReport) => { setSelected(item); setForm({ departmentId: String(item.department || ''), scope: item.scope, metricRows: parseMetrics(item.metrics), status: item.status }); setModal('edit'); };

  const handleSave = async () => {
    if (!form.scope) { toast.error('Select a scope'); return; }
    if (!form.departmentId) { toast.error('Select a department'); return; }
    if (form.metricRows.filter(r => r.key.trim()).length === 0) { toast.error('Add at least one metric'); return; }
    setSaving(true);
    try {
      const payload: ICreateReportRequest = { generatedBy: user?.id || '', departmentId: form.departmentId, scope: form.scope as ReportScope, metrics: serializeMetrics(form.metricRows), status: form.status };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/reports/${selected.id}`, payload);
        toast.success('Report updated');
      } else {
        await apiClient.post('/reports', payload);
        toast.success('Report created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save report'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/reports/${selected.id}`);
      toast.success('Report deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete report'); } finally { setSaving(false); }
  };

  const deptName = (id: string) => data.departments.find(d => d.id === id)?.departmentName ?? '—';
  const updRow = (i: number, f: keyof TMetricRow, v: string) => setForm(prev => ({ ...prev, metricRows: prev.metricRows.map((x, idx) => idx === i ? { ...x, [f]: v } : x) }));

  const renderMetrics = (json: string) => {
    try {
      const o = JSON.parse(json);
      if (o && typeof o === 'object') {
        const entries = Object.entries(o);
        return entries.length ? (
          <div className="flex flex-wrap gap-1">
            {entries.map(([k, v]) => (
              <span key={k} className="text-xs bg-bg border border-border rounded px-2 py-0.5 text-secondary">
                {k}: <strong className="text-base">{String(v)}</strong>
              </span>
            ))}
          </div>
        ) : <span className="text-tertiary">—</span>;
      }
    } catch { /* invalid json — return default */ }
    return <span className="text-tertiary">—</span>;
  };

  const columns: Column<IReport>[] = [
    { key: 'scope',       label: 'Scope',      render: item => formatEnum(item.scope) },
    { key: 'department',  label: 'Department', render: item => deptName(String(item.department || '')) },
    { key: 'generatedBy', label: 'Generated By', render: item => {
      const g = item.generatedBy;
      return g && typeof g === 'object' && 'name' in g ? (g as { name: string }).name : String(g || '—');
    }},
    { key: 'metrics',     label: 'Metrics',    render: item => renderMetrics(item.metrics) },
    { key: 'status',      label: 'Status',     render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={isDeptHead && !isAdmin ? 'Reports for your department' : 'Generate and manage institutional reports'}
        action={canEdit ? (
          <button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />New Report</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={canEdit ? item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        ) : undefined}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Report' : 'New Report'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <div>
              <label className="form-label">Scope</label>
              <select className="form-select" value={form.scope} onChange={e => setForm(f => ({ ...f, scope: e.target.value }))}>
                {Object.values(ReportScope).map(s => <option key={s} value={s}>{formatEnum(s)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Department</label>
              <select className="form-select" value={form.departmentId} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
                <option value="">Select department</option>
                {data.departments.map(d => <option key={d.id} value={d.id}>{d.departmentName}</option>)}
              </select>
            </div>
          </div>

          <div className="border border-border rounded-lg p-4 mb-4 bg-bg">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Metrics</span>
              <span className="text-xs text-secondary">{form.metricRows.filter(r => r.key.trim()).length} entries</span>
            </div>
            {form.metricRows.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-2 items-center">
                <input className="form-control" placeholder="Metric name" value={row.key} onChange={e => updRow(i, 'key', e.target.value)} />
                <input className="form-control" placeholder="Value" value={row.value} onChange={e => updRow(i, 'value', e.target.value)} />
                <button className="icon-btn icon-btn-danger" onClick={() => setForm(f => ({ ...f, metricRows: f.metricRows.filter((_, idx) => idx !== i) }))} disabled={form.metricRows.length === 1}>
                  <BsDashCircle size={13} />
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm" onClick={() => setForm(f => ({ ...f, metricRows: [...f.metricRows, { key: '', value: '' }] }))}>
              <BsPlus className="me-1" />Add Metric
            </button>
          </div>

          <div>
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))}>
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

      <DeleteModal show={modal === 'delete'} onClose={() => setModal(null)} onConfirm={handleDelete} saving={saving} />
    </>
  );
};

export default ReportPage;
