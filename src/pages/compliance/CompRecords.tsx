import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { complianceService } from '@/services/compliance.service';
import { studentService } from '@/services/student.service';
import { facultyService } from '@/services/faculty.service';
import { departmentService } from '@/services/department.service';
import { courseService } from '@/services/course.service';
import { curriculumService } from '@/services/curriculum.service';
import { examService } from '@/services/exam.service';
import { thesisService } from '@/services/thesis.service';
import { researchService } from '@/services/research.service';
import { documentService } from '@/services/document.service';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ComplianceRecord, CreateComplianceRecordRequest } from '@/types/compliance.types';
import { ComplianceResult, ComplianceEntityType } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';

type ModalMode = 'create' | 'edit' | 'delete' | null;

export default function CompRecords() {
  const { user } = useAuth();
  const [items, setItems] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<ComplianceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const [entityType, setEntityType] = useState<string>(ComplianceEntityType.STUDENT);
  const [entityId, setEntityId] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<string>(ComplianceResult.COMPLIANT);
  const [complianceDate, setComplianceDate] = useState('');
  const [entityList, setEntityList] = useState<{ id: string; label: string }[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entityNameMap, setEntityNameMap] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      setLoading(true);
      const data = await complianceService.getAll();
      setItems(data);
      const uniqueTypes = [...new Set(data.map(r => r.entityType))];
      uniqueTypes.forEach(t => fetchEntities(t, false));
    } catch { toast.error('Failed to load compliance records'); }
    finally { setLoading(false); }
  };

  const fetchEntities = async (type: string, updateList = true) => {
    if (updateList) { setEntitiesLoading(true); setEntityList([]); }
    try {
      let list: { id: string; label: string }[] = [];
      switch (type) {
        case ComplianceEntityType.STUDENT: { const d = await studentService.getAll(); list = d.map(s => ({ id: s.id, label: s.name })); break; }
        case ComplianceEntityType.FACULTY: { const d = await facultyService.getAll(); list = d.map(f => ({ id: f.id, label: f.name })); break; }
        case ComplianceEntityType.DEPARTMENT: { const d = await departmentService.getAll(); list = d.map(x => ({ id: x.id, label: x.departmentName })); break; }
        case ComplianceEntityType.COURSE: { const d = await courseService.getAll(); list = d.map(c => ({ id: c.id, label: c.title })); break; }
        case ComplianceEntityType.CURRICULUM: { const d = await curriculumService.getAll(); list = d.map(c => ({ id: c.id, label: c.description })); break; }
        case ComplianceEntityType.EXAM: { const d = await examService.getAll(); list = d.map(e => ({ id: e.id, label: `${formatEnum(e.type)} — ${e.date}` })); break; }
        case ComplianceEntityType.THESIS: { const d = await thesisService.getAll(); list = d.map(t => ({ id: t.id!, label: t.title })); break; }
        case ComplianceEntityType.RESEARCH_PROJECT: { const d = await researchService.getAll(); list = d.map(r => ({ id: r.projectID, label: r.title })); break; }
        case ComplianceEntityType.STUDENT_DOCUMENT: { const d = await documentService.getAll(); list = d.map(x => ({ id: x.studentDocumentId, label: `${formatEnum(x.docType)}${x.studentName ? ' — ' + x.studentName : ''}` })); break; }
      }
      if (updateList) setEntityList(list);
      setEntityNameMap(prev => { const next = { ...prev }; list.forEach(({ id, label }) => { next[id] = label; }); return next; });
    } catch { if (updateList) toast.error('Failed to load entities'); }
    finally { if (updateList) setEntitiesLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleTypeChange = (type: string) => { setEntityType(type); setEntityId(''); fetchEntities(type); };

  const openCreate = () => {
    setSelected(null); setEntityType(ComplianceEntityType.STUDENT); setEntityId('');
    setNotes(''); setResult(ComplianceResult.COMPLIANT); setComplianceDate('');
    fetchEntities(ComplianceEntityType.STUDENT);
    setModal('create');
  };

  const openEdit = (item: ComplianceRecord) => {
    setSelected(item); setEntityType(item.entityType); setEntityId(item.entityId);
    setNotes(item.notes ?? ''); setResult(item.result); setComplianceDate(item.complianceDate);
    fetchEntities(item.entityType);
    setModal('edit');
  };

  const handleSave = async () => {
    if (!entityId) { toast.error('Please select an entity'); return; }
    if (!complianceDate) { toast.error('Please select a compliance date'); return; }
    setSaving(true);
    try {
      const payload: CreateComplianceRecordRequest = {
        recordedByUserId: user?.id || '',
        entityId, entityType: entityType as ComplianceEntityType,
        result: result as ComplianceResult, complianceDate, notes,
      };
      if (modal === 'edit' && selected) { await complianceService.update(selected.id, payload); toast.success('Record updated'); }
      else { await complianceService.create(payload); toast.success('Record created'); }
      setModal(null); load();
    } catch { toast.error('Failed to save record'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setSaving(true);
    try { await complianceService.delete(selected.id); toast.success('Record deleted'); setModal(null); load(); }
    catch { toast.error('Failed to delete record'); }
    finally { setSaving(false); }
  };

  const columns: Column<ComplianceRecord>[] = [
    { key: 'entityType',     label: 'Entity Type', render: item => formatEnum(item.entityType) },
    { key: 'entityId',       label: 'Entity',      render: item => entityNameMap[item.entityId] ?? <span style={{ color: 'var(--text-2)', fontStyle: 'italic' }}>Loading…</span> },
    { key: 'notes',          label: 'Notes',       render: item => item.notes ? (item.notes.length > 60 ? item.notes.slice(0, 60) + '…' : item.notes) : '—' },
    { key: 'result',         label: 'Result',      render: item => <StatusBadge status={item.result} /> },
    { key: 'complianceDate', label: 'Date' },
  ];

  return (
    <>
      <PageHeader title="Compliance Records" subtitle="Manage compliance records"
        action={<button className="btn btn-primary btn-sm" onClick={openCreate}><BsPlus className="me-1" />Add Record</button>}
      />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="icon-btn" onClick={() => openEdit(item)} title="Edit"><BsPencil size={13} /></button>
            <button className="icon-btn icon-btn-danger" onClick={() => { setSelected(item); setModal('delete'); }} title="Delete"><BsTrash size={13} /></button>
          </div>
        )}
      />

      <Modal show={modal === 'create' || modal === 'edit'} onHide={() => setModal(null)} size="lg">
        <Modal.Header closeButton><Modal.Title>{modal === 'edit' ? 'Edit Record' : 'Create Compliance Record'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Entity Type</label>
            <select className="form-select" value={entityType} onChange={e => handleTypeChange(e.target.value)}>
              {Object.values(ComplianceEntityType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Entity</label>
            <select className="form-select" value={entityId} onChange={e => setEntityId(e.target.value)} disabled={entitiesLoading}>
              <option value="">{entitiesLoading ? 'Loading…' : `Select ${formatEnum(entityType)}`}</option>
              {entityList.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div>
              <label className="form-label">Result</label>
              <select className="form-select" value={result} onChange={e => setResult(e.target.value)}>
                {Object.values(ComplianceResult).map(r => <option key={r} value={r}>{formatEnum(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Compliance Date</label>
              <input type="date" className="form-control" value={complianceDate} onChange={e => setComplianceDate(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes…" />
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
        <Modal.Body style={{ padding: 28, textAlign: 'center' }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>Delete this record?</p>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 24 }}>This cannot be undone.</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={saving}>Delete</button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
