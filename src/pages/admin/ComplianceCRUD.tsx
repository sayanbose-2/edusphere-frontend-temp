import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import type { ComplianceRecord, CreateComplianceRecordRequest } from '@/types/compliance.types';
import { ComplianceResult, ComplianceEntityType } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';

export default function ComplianceCRUD() {
  const { user } = useAuth();
  const [items, setItems] = useState<ComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ComplianceRecord | null>(null);

  const [entityType, setEntityType] = useState<string>(ComplianceEntityType.STUDENT);
  const [entityId, setEntityId] = useState('');
  const [notes, setNotes] = useState('');
  const [result, setResult] = useState<string>(ComplianceResult.COMPLIANT);
  const [complianceDate, setComplianceDate] = useState('');

  const [entityList, setEntityList] = useState<{ id: string; label: string }[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entityNameMap, setEntityNameMap] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await complianceService.getAll();
      setItems(data);
      const uniqueTypes = [...new Set(data.map((r) => r.entityType))];
      uniqueTypes.forEach((t) => fetchEntities(t));
    } catch {
      toast.error('Failed to load compliance records');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntities = async (type: string) => {
    setEntitiesLoading(true);
    setEntityList([]);
    try {
      let list: { id: string; label: string }[] = [];
      switch (type) {
        case ComplianceEntityType.STUDENT: {
          const data = await studentService.getAll();
          list = data.map((s) => ({ id: s.id, label: s.name }));
          break;
        }
        case ComplianceEntityType.FACULTY: {
          const data = await facultyService.getAll();
          list = data.map((f) => ({ id: f.id, label: f.name }));
          break;
        }
        case ComplianceEntityType.DEPARTMENT: {
          const data = await departmentService.getAll();
          list = data.map((d) => ({ id: d.id, label: d.departmentName }));
          break;
        }
        case ComplianceEntityType.COURSE: {
          const data = await courseService.getAll();
          list = data.map((c) => ({ id: c.id, label: c.title }));
          break;
        }
        case ComplianceEntityType.CURRICULUM: {
          const data = await curriculumService.getAll();
          list = data.map((c) => ({ id: c.id, label: c.description }));
          break;
        }
        case ComplianceEntityType.EXAM: {
          const data = await examService.getAll();
          list = data.map((e) => ({ id: e.id, label: `${formatEnum(e.type)} — ${e.date}` }));
          break;
        }
        case ComplianceEntityType.THESIS: {
          const data = await thesisService.getAll();
          list = data.map((t) => ({ id: t.id!, label: t.title }));
          break;
        }
        case ComplianceEntityType.RESEARCH_PROJECT: {
          const data = await researchService.getAll();
          list = data.map((r) => ({ id: r.projectID, label: r.title }));
          break;
        }
        case ComplianceEntityType.STUDENT_DOCUMENT: {
          const data = await documentService.getAll();
          list = data.map((d) => ({
            id: d.studentDocumentId,
            label: `${formatEnum(d.docType)}${d.studentName ? ' — ' + d.studentName : ''}`,
          }));
          break;
        }
      }
      setEntityList(list);
      setEntityNameMap((prev) => {
        const next = { ...prev };
        list.forEach(({ id, label }) => { next[id] = label; });
        return next;
      });
    } catch {
      toast.error('Failed to load entities for selection');
    } finally {
      setEntitiesLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleEntityTypeChange = (type: string) => {
    setEntityType(type);
    setEntityId('');
    fetchEntities(type);
  };

  const openCreate = () => {
    setEditItem(null);
    setEntityType(ComplianceEntityType.STUDENT);
    setEntityId('');
    setNotes('');
    setResult(ComplianceResult.COMPLIANT);
    setComplianceDate('');
    fetchEntities(ComplianceEntityType.STUDENT);
    setShowModal(true);
  };

  const openEdit = (item: ComplianceRecord) => {
    setEditItem(item);
    setEntityType(item.entityType);
    setEntityId(item.entityId);
    setNotes(item.notes);
    setResult(item.result);
    setComplianceDate(item.complianceDate);
    fetchEntities(item.entityType);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!entityId) { toast.error('Please select an entity'); return; }
    if (!complianceDate) { toast.error('Please select a compliance date'); return; }
    try {
      const payload: CreateComplianceRecordRequest = {
        recordedByUserId: user?.id || '',
        entityId,
        entityType: entityType as ComplianceEntityType,
        result: result as ComplianceResult,
        complianceDate,
        notes,
      };
      if (editItem) {
        await complianceService.update(editItem.id, payload);
        toast.success('Compliance record updated');
      } else {
        await complianceService.create(payload);
        toast.success('Compliance record created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save compliance record');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await complianceService.delete(id);
      toast.success('Compliance record deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete compliance record');
    }
  };

  const columns: Column<ComplianceRecord>[] = [
    { key: 'entityType', label: 'Entity Type', render: (item) => formatEnum(item.entityType) },
    {
      key: 'entityId',
      label: 'Entity',
      render: (item) => entityNameMap[item.entityId] ?? <span className="text-muted fst-italic">Loading...</span>,
    },
    {
      key: 'notes',
      label: 'Notes',
      render: (item) => item.notes.length > 60 ? item.notes.substring(0, 60) + '...' : item.notes,
    },
    {
      key: 'result',
      label: 'Result',
      render: (item) => <StatusBadge status={item.result} />,
    },
    { key: 'complianceDate', label: 'Date' },
  ];

  return (
    <div>
      <PageHeader
        title="Compliance Records"
        subtitle="Manage compliance records"
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
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Compliance Record' : 'Create Compliance Record'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Entity Type</Form.Label>
              <Form.Select value={entityType} onChange={(e) => handleEntityTypeChange(e.target.value)}>
                {Object.values(ComplianceEntityType).map((t) => (
                  <option key={t} value={t}>{formatEnum(t)}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Entity</Form.Label>
              <Form.Select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                disabled={entitiesLoading}
              >
                <option value="">
                  {entitiesLoading ? 'Loading...' : `Select ${formatEnum(entityType)}`}
                </option>
                {entityList.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Result</Form.Label>
              <Form.Select value={result} onChange={(e) => setResult(e.target.value)}>
                {Object.values(ComplianceResult).map((r) => (
                  <option key={r} value={r}>{formatEnum(r)}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Compliance Date</Form.Label>
              <Form.Control type="date" value={complianceDate} onChange={(e) => setComplianceDate(e.target.value)} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control as="textarea" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
