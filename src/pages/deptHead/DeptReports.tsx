import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
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
import type { ReportScope } from '@/types/enums';

export default function DeptReports() {
  const { user } = useAuth();
  const [items, setItems] = useState<Report[]>([]);
  const [myDept, setMyDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [scope, setScope] = useState('');
  const [metrics, setMetrics] = useState('');
  const [status, setStatus] = useState<Status>('ACTIVE' as Status);

  const load = async () => {
    try {
      setLoading(true);
      const allDepts = await departmentService.getAll();
      const found = allDepts.find(d => d.headId === user?.id) || null;
      setMyDept(found);
      let reports: Report[];
      if (found) {
        try { reports = await reportService.getByDepartment(found.id); }
        catch { reports = await reportService.getAll(); }
      } else {
        reports = await reportService.getAll();
      }
      setItems(reports);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => { setScope(''); setMetrics(''); setStatus('ACTIVE' as Status); setModal(true); };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const payload: CreateReportRequest = {
        generatedBy: user?.id || '',
        departmentId: myDept?.id || '',
        scope: scope as ReportScope, metrics, status,
      };
      await reportService.create(payload);
      toast.success('Report created'); setModal(false); load();
    } catch { toast.error('Failed to create report'); }
    finally { setSaving(false); }
  };

  const columns: Column<Report>[] = [
    { key: 'scope',      label: 'Scope' },
    { key: 'department', label: 'Department', render: item => String(item.department || '—') },
    { key: 'metrics',    label: 'Metrics',    render: item => item.metrics.length > 60 ? item.metrics.slice(0, 60) + '…' : item.metrics },
    { key: 'status',     label: 'Status',     render: item => <StatusBadge status={item.status} /> },
  ];

  return (
    <>
      <PageHeader title="Reports" subtitle={myDept ? `Reports for ${myDept.departmentName}` : 'Department reports'}
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Create Report</button>}
      />
      <DataTable columns={columns} data={items} loading={loading} />

      <Modal show={modal} onHide={() => setModal(false)} size="lg">
        <Modal.Header closeButton><Modal.Title>Create Report</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Scope</label>
            <select className="form-select" value={scope} onChange={e => setScope(e.target.value)}>
              <option value="">Select scope</option>
              <option value="DEPARTMENT">Department</option>
              <option value="INSTITUTION">Institution</option>
              <option value="FINANCIAL">Financial</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="ACADEMIC">Academic</option>
              <option value="RESEARCH">Research</option>
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Metrics</label>
            <textarea className="form-control" rows={5} value={metrics} onChange={e => setMetrics(e.target.value)} />
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
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleCreate} disabled={saving}>
            {saving && <span className="spinner-border spinner-border-sm me-2" />}Create
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
