import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { gradeService } from '@/services/grade.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { Grade, Exam, Course } from '@/types/academic.types';

export default function MyGrades() {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const gradeData = await gradeService.getMy();
        setGrades(gradeData);

        const uniqueExamIds = [...new Set(gradeData.map((g) => g.examId))];
        const examData = await Promise.all(uniqueExamIds.map((id) => examService.getById(id)));
        setExams(examData);

        const uniqueCourseIds = [...new Set(examData.map((e) => e.courseId))];
        const courseData = await Promise.all(uniqueCourseIds.map((id) => courseService.getById(id)));
        setCourses(courseData);
      } catch {
        toast.error('Failed to load grades');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
        title="My Grades"
        subtitle="View your exam grades and results"
      />

      <DataTable
        columns={columns}
        data={grades}
        loading={loading}
      />
    </div>
  );
}
