import { useState, useEffect } from 'react';
import { Modal, Form, Button, Badge } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDash, BsFileEarmarkBarGraph } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { departmentService } from '@/services/department.service';
import { reportService } from '@/services/report.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { Status } from '@/types/enums';
import type { Department } from '@/types/academic.types';
import type { Report, CreateReportRequest } from '@/types/compliance.types';

type MetricRow = { key: string; value: string };

const SCOPE_LABELS: Record<string, string> = {
  STUDENT_PERFORMANCE: 'Student Performance',
  FACULTY_WORKLOAD: 'Faculty Workload',
  DEPARTMENT_OVERVIEW: 'Department Overview',
  COURSE_ANALYTICS: 'Course Analytics',
  EXAM_RESULTS: 'Exam Results',
  THESIS_STATUS: 'Thesis Status',
  RESEARCH_PROGRESS: 'Research Progress',
  COMPLIANCE_SUMMARY: 'Compliance Summary',
  AUDIT_SUMMARY: 'Audit Summary',
};

const SCOPE_COLORS: Record<string, string> = {
  STUDENT_PERFORMANCE: '#3b82f6',
  FACULTY_WORKLOAD: '#8b5cf6',
  DEPARTMENT_OVERVIEW: '#0ea5e9',
  COURSE_ANALYTICS: '#f59e0b',
  EXAM_RESULTS: '#ef4444',
  THESIS_STATUS: '#10b981',
  RESEARCH_PROGRESS: '#6366f1',
  COMPLIANCE_SUMMARY: '#f97316',
  AUDIT_SUMMARY: '#14b8a6',
};

const parseMetrics = (json: string): MetricRow[] => {
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
    }
  } catch {
    // ignore
  }
  return [{ key: '', value: '' }];
};

const serializeMetrics = (rows: MetricRow[]): string => {
  const obj: Record<string, string> = {};
  rows.forEach(({ key, value }) => {
    if (key.trim()) obj[key.trim()] = value;
  });
  return JSON.stringify(obj);
};

export default function ReportCRUD() {
  const { user } = useAuth();
  const [items, setItems] = useState<Report[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Report | null>(null);

  const [departmentId, setDepartmentId] = useState('');
  const [scope, setScope] = useState('');
  const [metricRows, setMetricRows] = useState<MetricRow[]>([{ key: '', value: '' }]);
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportData, deptData] = await Promise.all([
        reportService.getAll(),
        departmentService.getAll(),
      ]);
      setItems(reportData);
      setDepartments(deptData);
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
    setEditItem(null);
    setDepartmentId('');
    setScope('');
    setMetricRows([{ key: '', value: '' }]);
    setStatus('ACTIVE' as Status);
    setShowModal(true);
  };

  const openEdit = (item: Report) => {
    setEditItem(item);
    setDepartmentId(item.department as string || '');
    setScope(item.scope);
    setMetricRows(parseMetrics(item.metrics));
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateReportRequest = {
        generatedBy: user?.id || '',
        departmentId,
        scope: scope as import('@/types/enums').ReportScope,
        metrics: serializeMetrics(metricRows),
        status,
      };
      if (editItem) {
        await reportService.update(editItem.id, payload);
        toast.success('Report updated');
      } else {
        await reportService.create(payload);
        toast.success('Report created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save report');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await reportService.delete(id);
      toast.success('Report deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete report');
    }
  };

  const getDepartmentName = (id: string) =>
    departments.find((d) => d.id === id)?.departmentName ?? '-';

  const updateRow = (idx: number, field: keyof MetricRow, val: string) => {
    const updated = [...metricRows];
    updated[idx] = { ...updated[idx], [field]: val };
    setMetricRows(updated);
  };

  const renderMetrics = (json: string) => {
    try {
      const obj = JSON.parse(json);
      if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
        const entries = Object.entries(obj);
        if (entries.length === 0) return <span className="text-muted fst-italic">No metrics</span>;
        return (
          <div className="d-flex flex-wrap gap-1">
            {entries.map(([k, v]) => (
              <span
                key={k}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ color: 'var(--text-secondary)', margin: '0 1px' }}>·</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{String(v)}</span>
              </span>
            ))}
          </div>
        );
      }
    } catch {
      // ignore
    }
    return <span className="text-muted fst-italic">—</span>;
  };

  const renderScope = (scopeVal: string) => {
    const color = SCOPE_COLORS[scopeVal] ?? '#6b7280';
    const label = SCOPE_LABELS[scopeVal] ?? scopeVal;
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: `${color}18`,
          color,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </span>
    );
  };

  const columns: Column<Report>[] = [
    {
      key: 'scope',
      label: 'Scope',
      render: (item) => renderScope(item.scope),
    },
    {
      key: 'department',
      label: 'Department',
      render: (item) => getDepartmentName(item.department as string),
    },
    {
      key: 'generatedBy',
      label: 'Generated By',
      render: (item) => {
        const g = item.generatedBy;
        if (g && typeof g === 'object' && 'name' in g) return g.name;
        return String(g || '-');
      },
    },
    {
      key: 'metrics',
      label: 'Metrics',
      render: (item) => renderMetrics(item.metrics),
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
        subtitle="Manage reports"
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

      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header
          closeButton
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', color: '#fff' }}
        >
          <Modal.Title className="d-flex align-items-center gap-2" style={{ fontSize: '1rem' }}>
            <BsFileEarmarkBarGraph size={18} />
            {editItem ? 'Edit Report' : 'Create Report'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: '#f8fafc', padding: '1.5rem' }}>
          <Form>
            {/* Row 1: Scope + Department */}
            <div className="row g-3 mb-3">
              <div className="col-md-6">
                <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Report Scope
                </Form.Label>
                <Form.Select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  <option value="">Select scope…</option>
                  {Object.entries(SCOPE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-6">
                <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Department
                </Form.Label>
                <Form.Select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  style={{ borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  <option value="">Select department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.departmentName}</option>
                  ))}
                </Form.Select>
              </div>
            </div>

            {/* Metrics builder */}
            <div
              className="mb-3 p-3"
              style={{ background: 'var(--bg-raised)', borderRadius: '10px', border: '1px solid var(--border)' }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Form.Label className="fw-semibold mb-0" style={{ fontSize: '0.85rem', color: '#374151' }}>
                  Metrics
                </Form.Label>
                <Badge bg="secondary" style={{ fontSize: '0.72rem' }}>
                  {metricRows.filter(r => r.key.trim()).length} entries
                </Badge>
              </div>

              {/* Header row */}
              <div className="row g-2 mb-1 px-1">
                <div className="col">
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Metric Name
                  </span>
                </div>
                <div className="col">
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Value
                  </span>
                </div>
                <div style={{ width: '42px' }} />
              </div>

              {metricRows.map((row, idx) => (
                <div key={idx} className="row g-2 mb-2 align-items-center">
                  <div className="col">
                    <Form.Control
                      placeholder="e.g. pass_rate"
                      value={row.key}
                      onChange={(e) => updateRow(idx, 'key', e.target.value)}
                      style={{ borderRadius: '8px', fontSize: '0.88rem', borderColor: '#d1d5db' }}
                    />
                  </div>
                  <div className="col">
                    <Form.Control
                      placeholder="e.g. 87%"
                      value={row.value}
                      onChange={(e) => updateRow(idx, 'value', e.target.value)}
                      style={{ borderRadius: '8px', fontSize: '0.88rem', borderColor: '#d1d5db' }}
                    />
                  </div>
                  <div style={{ width: '42px' }}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      style={{ borderRadius: '8px', padding: '4px 8px' }}
                      onClick={() => setMetricRows(metricRows.filter((_, i) => i !== idx))}
                      disabled={metricRows.length === 1}
                    >
                      <BsDash />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline-primary"
                size="sm"
                style={{ borderRadius: '8px', fontSize: '0.82rem', marginTop: '4px' }}
                onClick={() => setMetricRows([...metricRows, { key: '', value: '' }])}
              >
                <BsPlus className="me-1" /> Add Metric
              </Button>
            </div>

            {/* Status */}
            <div>
              <Form.Label className="fw-semibold" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Status
              </Form.Label>
              <div className="d-flex gap-3">
                {(['ACTIVE', 'INACTIVE'] as Status[]).map((s) => (
                  <Form.Check
                    key={s}
                    type="radio"
                    id={`status-${s}`}
                    label={s}
                    value={s}
                    checked={status === s}
                    onChange={() => setStatus(s)}
                    style={{ fontSize: '0.9rem' }}
                  />
                ))}
              </div>
            </div>
          </Form>
        </Modal.Body>

        <Modal.Footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
          <Button variant="light" onClick={() => setShowModal(false)} style={{ borderRadius: '8px' }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} style={{ borderRadius: '8px', minWidth: '90px' }}>
            {editItem ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
