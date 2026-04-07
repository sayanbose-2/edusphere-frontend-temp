import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPencil, BsTrash, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { gradeService } from '@/services/grade.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { GradeStatus } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Grade, CreateGradeRequest, Exam, Student, Course } from '@/types/academic.types';

export default function GradeSubmission() {
  const [items, setItems] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Grade | null>(null);

  const [examId, setExamId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [score, setScore] = useState(0);
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState<GradeStatus>(GradeStatus.PENDING);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gradeData, examData, studentData, courseData] = await Promise.all([
        gradeService.getAll(),
        examService.getAll(),
        studentService.getAll(),
        courseService.getAll(),
      ]);
      setItems(gradeData);
      setExams(examData);
      setStudents(studentData);
      setCourses(courseData);
    } catch {
      toast.error('Failed to load grades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditItem(null);
    setExamId('');
    setStudentId('');
    setScore(0);
    setGrade('');
    setStatus(GradeStatus.PENDING);
    setShowModal(true);
  };

  const openEdit = (item: Grade) => {
    setEditItem(item);
    setExamId(item.examId);
    setStudentId(item.studentId);
    setScore(item.score);
    setGrade(item.grade);
    setStatus(item.status);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload: CreateGradeRequest = { examId, studentId, score, grade, status };
      if (editItem) {
        await gradeService.update(editItem.id!, payload);
        toast.success('Grade updated');
      } else {
        await gradeService.create(payload);
        toast.success('Grade submitted');
      }
      setShowModal(false);
      fetchData();
    } catch {
      toast.error('Failed to save grade');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await gradeService.delete(id);
      toast.success('Grade deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete grade');
    }
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '—';
  const getExamLabel = (id: string) => {
    const exam = exams.find((e) => e.id === id);
    if (!exam) return '—';
    const course = courses.find((c) => c.id === exam.courseId);
    return `${course?.title || '—'} — ${formatEnum(exam.type)}`;
  };

  const columns: Column<Grade>[] = [
    {
      key: 'examId',
      label: 'Exam',
      render: (item) => getExamLabel(item.examId),
    },
    {
      key: 'studentId',
      label: 'Student',
      render: (item) => getStudentName(item.studentId),
    },
    { key: 'score', label: 'Score' },
    { key: 'grade', label: 'Grade' },
    {
      key: 'status',
      label: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Grade Submission"
        subtitle="Submit and manage student grades"
        action={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <BsPlus className="me-1" /> Submit Grade
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button variant="outline-primary" size="sm" onClick={() => openEdit(item)} disabled={!item.id}>
              <BsPencil />
            </Button>
            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(item.id!)} disabled={!item.id}>
              <BsTrash />
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{editItem ? 'Edit Grade' : 'Submit Grade'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Exam</Form.Label>
              <Form.Select value={examId} onChange={(e) => setExamId(e.target.value)}>
                <option value="">Select Exam</option>
                {exams.map((ex) => {
                  const course = courses.find((c) => c.id === ex.courseId);
                  return (
                    <option key={ex.id} value={ex.id}>{course?.title || ''} - {ex.type}</option>
                  );
                })}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Student</Form.Label>
              <Form.Select value={studentId} onChange={(e) => setStudentId(e.target.value)}>
                <option value="">Select Student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Score</Form.Label>
              <Form.Control type="number" value={score} onChange={(e) => setScore(Number(e.target.value))} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Grade</Form.Label>
              <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                <option value="">Select Grade</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="F">F</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select value={status} onChange={(e) => setStatus(e.target.value as GradeStatus)}>
                <option value="PASS">PASS</option>
                <option value="FAIL">FAIL</option>
                <option value="PENDING">PENDING</option>
              </Form.Select>
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
