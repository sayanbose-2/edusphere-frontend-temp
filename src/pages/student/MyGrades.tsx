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
        <div style={{ padding: 40, textAlign: 'center' }}>
          <span className="spinner-border spinner-border-sm me-2" />Loading grades…
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="My Grades" subtitle="View your exam results by course" />

      {rows.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--text-2)', fontSize: 14 }}>
          No grades available yet. Results will appear here after your exams are completed and graded.
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Average Score</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{avg ?? '—'}</div>
            </div>
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Passed</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--success)' }}>{passed}</div>
            </div>
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>Failed</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--danger)' }}>{failed}</div>
            </div>
          </div>

          {/* Grades grouped by course */}
          {Object.values(grouped).map(courseRows => {
            const course = courseRows[0].course;
            return (
              <div key={course?.id ?? 'unknown'} className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 20px', background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{course?.title ?? 'Unknown Course'}</span>
                  {course && (
                    <span style={{ fontSize: 12, color: 'var(--text-3)', marginLeft: 10 }}>{course.credits} credits</span>
                  )}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: 'var(--table-header-bg)' }}>
                      <th style={{ padding: '8px 20px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)', fontSize: 12 }}>Exam Type</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)', fontSize: 12 }}>Date</th>
                      <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-2)', fontSize: 12 }}>Score</th>
                      <th style={{ padding: '8px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-2)', fontSize: 12 }}>Grade</th>
                      <th style={{ padding: '8px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-2)', fontSize: 12 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseRows.map((r, i) => (
                      <tr key={r.grade.id ?? i} style={{ borderTop: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 20px' }}>
                          <StatusBadge status={r.exam?.type} />
                        </td>
                        <td style={{ padding: '10px 16px', color: 'var(--text-2)' }}>
                          {r.exam ? new Date(r.exam.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'}
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{r.grade.score}</span>
                          <span style={{ color: 'var(--text-3)', fontSize: 11 }}>/100</span>
                        </td>
                        <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: 16,
                            color: r.grade.grade === 'F' ? 'var(--danger)' : r.grade.grade === 'A' ? 'var(--success)' : 'var(--accent)',
                          }}>
                            {r.grade.grade}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
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
