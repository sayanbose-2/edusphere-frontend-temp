import { DateInput } from '@/components/common/DateInput';
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import DeleteModal from '@/components/common/DeleteModal';
import { ComplianceResult, ComplianceEntityType, ComplianceType, Role } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IComplianceRecord, ICreateComplianceRecordRequest } from '@/types/complianceTypes';
import type { IPageResponse } from '@/types/academicTypes';

type TModalMode = 'create' | 'edit' | 'delete' | null;

const EMPTY_FORM = {
  entityType: ComplianceEntityType.STUDENT as string,
  entityId: '',
  notes: '',
  result: ComplianceResult.PASS as string,
  complianceType: ComplianceType.COURSE as string,
  complianceDate: '',
};
const EMPTY_DATA = {
  items: [] as IComplianceRecord[],
  entityList: [] as { id: string; label: string }[],
  entityNameMap: {} as Record<string, string>,
};

const CompliancePage = () => {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes(Role.ADMIN) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<TModalMode>(null);
  const [selected, setSelected] = useState<IComplianceRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [entitiesLoading, setEntitiesLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const items = await apiClient.get<IComplianceRecord[]>('/compliance-records').then(r => r.data);
      setData(d => ({ ...d, items }));
      // pre-load entity names for display in table
      const uniqueTypes = [...new Set(items.map(r => r.entityType))];
      uniqueTypes.forEach(t => fetchEntities(t, false));
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load compliance records');
    } finally { setLoading(false); }
  };

  const fetchEntities = async (type: string, updateList = true) => {
    if (updateList) { setEntitiesLoading(true); setData(d => ({ ...d, entityList: [] })); }
    try {
      let list: { id: string; label: string }[] = [];
      // load entity options based on type selected
      switch (type) {
        case ComplianceEntityType.STUDENT: { const d = await apiClient.get<IPageResponse<{ id: string; name: string }>>('/students').then(r => r.data.content ?? []); list = d.map(s => ({ id: s.id, label: s.name })); break; }
        case ComplianceEntityType.FACULTY: { const d = await apiClient.get<IPageResponse<{ id: string; name: string }>>('/faculties').then(r => r.data.content ?? []); list = d.map(f => ({ id: f.id, label: f.name })); break; }
        case ComplianceEntityType.DEPARTMENT: { const d = await apiClient.get<IPageResponse<{ id: string; departmentName: string }>>('/departments').then(r => r.data.content ?? []); list = d.map(x => ({ id: x.id, label: x.departmentName })); break; }
        case ComplianceEntityType.COURSE: { const d = await apiClient.get<IPageResponse<{ id: string; title: string }>>('/courses').then(r => Array.isArray(r.data) ? r.data : (r.data.content ?? [])); list = d.map(c => ({ id: c.id, label: c.title })); break; }
        case ComplianceEntityType.CURRICULUM: { const d = await apiClient.get<IPageResponse<{ id: string; description: string }>>('/curriculums').then(r => r.data.content ?? []); list = d.map(c => ({ id: c.id, label: c.description })); break; }
        case ComplianceEntityType.EXAM: { const d = await apiClient.get<IPageResponse<{ id: string; type: string; date: string }>>('/exams').then(r => r.data.content ?? []); list = d.map(e => ({ id: e.id, label: `${formatEnum(e.type)} — ${e.date}` })); break; }
        case ComplianceEntityType.THESIS: { const d = await apiClient.get<IPageResponse<{ id: string; title: string }>>('/theses').then(r => r.data.content ?? []); list = d.map(t => ({ id: t.id!, label: t.title })); break; }
        case ComplianceEntityType.RESEARCH_PROJECT: { const d = await apiClient.get<IPageResponse<{ id: string; title: string }>>('/research-projects').then(r => r.data.content ?? []); list = d.map(r => ({ id: r.id, label: r.title })); break; }
        case ComplianceEntityType.STUDENT_DOCUMENT: { const d = await apiClient.get<IPageResponse<{ studentDocumentId: string; docType: string; studentName?: string }>>('/student-documents/all').then(r => r.data.content ?? []); list = d.map(x => ({ id: x.studentDocumentId, label: `${formatEnum(x.docType)}${x.studentName ? ' — ' + x.studentName : ''}` })); break; }
      }
      if (updateList) setData(d => ({ ...d, entityList: list }));
      setData(d => {
        const next = { ...d.entityNameMap };
        list.forEach(({ id, label }) => { next[id] = label; });
        return { ...d, entityNameMap: next };
      });
    } catch (err: unknown) {
      if (updateList) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 403 && status !== 404 && status !== 500) toast.error('Failed to load entities');
      }
    } finally { if (updateList) setEntitiesLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const openCreate = () => {
    setSelected(null);
    setForm({ ...EMPTY_FORM, entityType: ComplianceEntityType.STUDENT, entityId: '' });
    fetchEntities(ComplianceEntityType.STUDENT);
    setModal('create');
  };

  const openEdit = (item: IComplianceRecord) => {
    setSelected(item);
    setForm({ entityType: item.entityType, entityId: item.entityId, notes: item.notes ?? '', result: item.result, complianceType: EMPTY_FORM.complianceType, complianceDate: item.complianceDate });
    fetchEntities(item.entityType);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!form.entityId) { toast.error('Please select an entity'); return; }
    if (!form.complianceDate) { toast.error('Please select a compliance date'); return; }
    setSaving(true);
    try {
      const payload: ICreateComplianceRecordRequest = {
        recordedByUserId: user?.id || '',
        entityId: form.entityId, entityType: form.entityType as ComplianceEntityType,
        complianceType: form.complianceType as ComplianceType,
        result: form.result as ComplianceResult, complianceDate: form.complianceDate, notes: form.notes,
      };
      if (modal === 'edit' && selected) {
        await apiClient.put(`/compliance-records/${selected.id}`, payload);
        toast.success('Record updated');
      } else {
        await apiClient.post('/compliance-records', payload);
        toast.success('Record created');
      }
      setModal(null); load();
    } catch { toast.error('Failed to save record'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiClient.delete(`/compliance-records/${selected.id}`);
      toast.success('Record deleted'); setModal(null); load();
    } catch { toast.error('Failed to delete record'); } finally { setSaving(false); }
  };

  const columns: Column<IComplianceRecord>[] = [
    { key: 'entityType',     label: 'Entity Type', render: item => formatEnum(item.entityType) },
    { key: 'entityId',       label: 'Entity',      render: item => data.entityNameMap[item.entityId] ?? <span className="text-secondary italic" title={item.entityId}>{item.entityId.slice(0, 8)}…</span> },
    { key: 'notes',          label: 'Notes',       render: item => item.notes ? (item.notes.length > 60 ? item.notes.slice(0, 60) + '…' : item.notes) : '—' },
    { key: 'result',         label: 'Result',      render: item => <StatusBadge status={item.result} /> },
    { key: 'complianceDate', label: 'Date' },
  ];

  return (
    <>
      <PageHeader
        title="Compliance Records"
        subtitle="Manage compliance records"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Record</button>}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            {isAdmin && <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>}
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Record' : 'Create Compliance Record'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Entity Type</label>
            <select className="form-select" value={form.entityType} onChange={e => { setForm(f => ({ ...f, entityType: e.target.value, entityId: '' })); fetchEntities(e.target.value); }}>
              {Object.values(ComplianceEntityType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
            </select>
          </div>
          <div className="mb-3.5">
            <label className="form-label">Entity</label>
            <select className="form-select" value={form.entityId} onChange={e => setForm(f => ({ ...f, entityId: e.target.value }))} disabled={entitiesLoading}>
              <option value="">{entitiesLoading ? 'Loading…' : `Select ${formatEnum(form.entityType)}`}</option>
              {data.entityList.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Result</label>
              <select className="form-select" value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value }))}>
                {Object.values(ComplianceResult).map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Compliance Date</label>
              <DateInput value={form.complianceDate} onChange={v => setForm(f => ({ ...f, complianceDate: v }))} />
            </div>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes…" />
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

export default CompliancePage;
