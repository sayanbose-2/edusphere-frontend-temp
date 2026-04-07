import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus, BsDashCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { curriculumService } from '@/services/curriculum.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { Status } from '@/types/enums';
import type { Curriculum, Course, CreateCurriculumRequest } from '@/types/academic.types';

interface ModuleEntry {
  title: string;
  description: string;
  topics: string;
}

const emptyModule = (): ModuleEntry => ({ title: '', description: '', topics: '' });

const parseModules = (json: unknown): ModuleEntry[] => {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    if (!Array.isArray(parsed) || parsed.length === 0) return [emptyModule()];
    return parsed.map((m: Record<string, unknown>) => ({
      title: String(m.title || ''),
      description: String(m.description || ''),
      topics: Array.isArray(m.topics) ? m.topics.join(', ') : String(m.topics || ''),
    }));
  } catch {
    return [emptyModule()];
  }
};

const serializeModules = (modules: ModuleEntry[]): string =>
  JSON.stringify(
    modules
      .filter((m) => m.title.trim())
      .map((m) => ({
        title: m.title.trim(),
        description: m.description.trim(),
        topics: m.topics.split(',').map((t) => t.trim()).filter(Boolean),
      }))
  );

const countModules = (json: unknown): string => {
  try {
    const parsed = typeof json === 'string' ? JSON.parse(json) : json;
    const count = Array.isArray(parsed) ? parsed.length : 0;
    return `${count} module${count !== 1 ? 's' : ''}`;
  } catch {
    return '—';
  }
};

export default function CurriculumCRUD() {
  const [items, setItems] = useState<Curriculum[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Curriculum | null>(null);

  const [courseId, setCourseId] = useState('');
  const [description, setDescription] = useState('');
  const [modules, setModules] = useState<ModuleEntry[]>([emptyModule()]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [curData, courseData] = await Promise.all([
        curriculumService.getAll(),
        courseService.getAll(),
      ]);
      setItems(curData);
      setCourses(courseData);
    } catch {
      toast.error('Failed to load curriculums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setCourseId('');
    setDescription('');
    setModules([emptyModule()]);
    setShowModal(true);
  };

  const openEdit = (item: Curriculum) => {
    setEditItem(item);
    setCourseId(item.courseId);
    setDescription(item.description);
    setModules(parseModules(item.modulesJSON));
    setShowModal(true);
  };

  const updateModule = (index: number, field: keyof ModuleEntry, value: string) => {
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const addModule = () => setModules((prev) => [...prev, emptyModule()]);

  const removeModule = (index: number) => {
    setModules((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateCurriculumRequest = {
        courseId,
        description,
        modulesJSON: serializeModules(modules),
        status: Status.ACTIVE,
      };
      if (editItem) {
        await curriculumService.update(editItem.id, payload);
        toast.success('Curriculum updated');
      } else {
        await curriculumService.create(payload);
        toast.success('Curriculum created');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save curriculum');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await curriculumService.delete(id);
      toast.success('Curriculum deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete curriculum');
    }
  };

  const getCourseName = (id: string) => courses.find((c) => c.id === id)?.title || '—';

  const columns: Column<Curriculum>[] = [
    { key: 'courseId', label: 'Course', render: (item) => getCourseName(item.courseId) },
    { key: 'description', label: 'Description' },
    { key: 'modulesJSON', label: 'Modules', render: (item) => countModules(item.modulesJSON) },
  ];

  return (
    <div>
      <PageHeader
        title="Curriculums"
        subtitle="Manage course curriculums"
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
          <Modal.Title>{editItem ? 'Edit Curriculum' : 'Create Curriculum'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Course</Form.Label>
              <Form.Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Overall curriculum description"
              />
            </Form.Group>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0 fw-semibold">Modules</Form.Label>
              <Button variant="outline-primary" size="sm" onClick={addModule}>
                <BsPlus className="me-1" /> Add Module
              </Button>
            </div>

            {modules.map((mod, i) => (
              <div key={i} className="border rounded p-3 mb-3 bg-light">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-semibold small text-secondary">Module {i + 1}</span>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => removeModule(i)}
                    disabled={modules.length === 1}
                  >
                    <BsDashCircle />
                  </Button>
                </div>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1">Title</Form.Label>
                  <Form.Control
                    size="sm"
                    value={mod.title}
                    onChange={(e) => updateModule(i, 'title', e.target.value)}
                    placeholder="e.g. Introduction to the Course"
                  />
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label className="small mb-1">Description</Form.Label>
                  <Form.Control
                    size="sm"
                    value={mod.description}
                    onChange={(e) => updateModule(i, 'description', e.target.value)}
                    placeholder="Brief description of this module"
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label className="small mb-1">
                    Topics <span className="text-muted fw-normal">(comma-separated)</span>
                  </Form.Label>
                  <Form.Control
                    size="sm"
                    value={mod.topics}
                    onChange={(e) => updateModule(i, 'topics', e.target.value)}
                    placeholder="e.g. Variables, Loops, Functions"
                  />
                </Form.Group>
              </div>
            ))}
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
