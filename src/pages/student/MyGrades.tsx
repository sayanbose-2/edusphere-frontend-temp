import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { courseService } from '@/services/course.service';
import { examService } from '@/services/exam.service';
import { gradeService } from '@/services/grade.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Grade, Exam, Course } from '@/types/academic.types';

interface GradeRow {
  grade: Grade;
  exam: Exam;
  course: Course | undefined;
}

export default function MyGrades() {
  const [rows, setRows] = useState<GradeRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const gradeData = await gradeService.getMy();
        const uniqueExamIds = [...new Set(gradeData.map(g => g.examId))];
        const examData = await Promise.all(uniqueExamIds.map(id => examService.getById(id)));
        const uniqueCourseIds = [...new Set(examData.map(e => e.courseId))];
        const courseData = await Promise.all(uniqueCourseIds.map(id => courseService.getById(id)));

        const examMap: Record<string, Exam> = {};
        examData.forEach(e => { examMap[e.id] = e; });
        const courseMap: Record<string, Course> = {};
        courseData.forEach(c => { courseMap[c.id] = c; });

        setRows(gradeData.map(g => ({
          grade: g,
          exam: examMap[g.examId],
          course: examMap[g.examId] ? courseMap[examMap[g.examId].courseId] : undefined,
        })));
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status !== 404 && status !== 500) toast.error('Failed to load grades');
      }
      finally { setLoading(false); }
    };
    load();
  }, []);

  // Summary stats
  const scores = rows.map(r => r.grade.score).filter(s => s > 0);
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const passed = rows.filter(r => r.grade.status === 'PASS').length;
  const failed = rows.filter(r => r.grade.status === 'FAIL').length;

  // Group by course
  const grouped: Record<string, GradeRow[]> = {};
  rows.forEach(r => {
    const key = r.course?.id ?? 'unknown';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  });

  if (loading) {
    return (
      <>
        <PageHeader title="My Grades" subtitle="View your exam results" />
        <div className="py-10 text-center">
          <span className="spinner-border spinner-border-sm me-2" />Loading grades…
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Grades" subtitle="View your exam results by course" />

      {rows.length === 0 ? (
        <div className="py-8 text-center text-secondary text-base">
          No grades available yet. Results will appear here after your exams are completed and graded.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3.5 mb-6">
            <div className="card p-4">
              <div className="text-sm text-tertiary mb-1">Average Score</div>
              <div className="text-7xl font-black text-blue">{avg ?? '—'}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-tertiary mb-1">Passed</div>
              <div className="text-7xl font-black text-success">{passed}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-tertiary mb-1">Failed</div>
              <div className="text-7xl font-black text-danger">{failed}</div>
            </div>
          </div>

          {/* Grades grouped by course */}
          {Object.values(grouped).map(courseRows => {
            const course = courseRows[0].course;
            return (
              <div key={course?.id ?? 'unknown'} className="card mb-5 p-0 overflow-hidden">
                <div className="py-3 px-5 bg-base border-b border-border">
                  <span className="font-semibold text-lg">{course?.title ?? 'Unknown Course'}</span>
                  {course && (
                    <span className="text-sm text-tertiary ml-2.5">{course.credits} credits</span>
                  )}
                </div>
                <table className="w-full text-base">
                  <thead>
                    <tr>
                      <th className="py-2 px-5 text-left font-semibold text-secondary text-sm">Exam Type</th>
                      <th className="py-2 px-4 text-left font-semibold text-secondary text-sm">Date</th>
                      <th className="py-2 px-4 text-center font-semibold text-secondary text-sm">Score</th>
                      <th className="py-2 px-4 text-center font-semibold text-secondary text-sm">Grade</th>
                      <th className="py-2 px-4 text-left font-semibold text-secondary text-sm">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseRows.map((r, i) => (
                      <tr key={r.grade.id ?? i} className="border-t border-border">
                        <td className="py-2.5 px-5">
                          <StatusBadge status={r.exam?.type} />
                        </td>
                        <td className="py-2.5 px-4 text-secondary">
                          {r.exam ? new Date(r.exam.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className="font-semibold">{r.grade.score}</span>
                          <span className="text-tertiary text-xs">/100</span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`font-black text-lg ${
                            r.grade.grade === 'F' ? 'text-danger' :
                            r.grade.grade === 'A' ? 'text-success' : 'text-blue'
                          }`}>
                            {r.grade.grade}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          <StatusBadge status={r.grade.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
