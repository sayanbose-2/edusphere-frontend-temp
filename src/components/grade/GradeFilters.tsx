import { formatEnum } from "@/utils/formatters";
import type { IStudent, IExam } from "@/types/academicTypes";

interface Props {
  isAdmin: boolean;
  isDeptHead: boolean;
  isFaculty: boolean;
  students: IStudent[];
  allExams: IExam[];
  filters: { studentId: string; examId: string };
  onFilterStudent: (id: string) => void;
  onFilterExam: (id: string) => void;
  courseName: (id: string) => string;
}

export const GradeFilters = ({
  isAdmin,
  isDeptHead,
  isFaculty,
  students,
  allExams,
  filters,
  onFilterStudent,
  onFilterExam,
  courseName,
}: Props) => (
  <>
    {isAdmin && (
      <div className="flex gap-3.5 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="form-label m-0 whitespace-nowrap">Student</label>
          <select
            className="form-select form-select-sm min-w-40"
            value={filters.studentId}
            onChange={(e) => onFilterStudent(e.target.value)}
          >
            <option value="">All students</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="form-label m-0 whitespace-nowrap">Exam</label>
          <select
            className="form-select form-select-sm min-w-52"
            value={filters.examId}
            onChange={(e) => onFilterExam(e.target.value)}
          >
            <option value="">All exams</option>
            {allExams.map((e) => (
              <option key={e.id} value={e.id}>
                {courseName(e.courseId)} — {formatEnum(e.type)}
              </option>
            ))}
          </select>
        </div>
      </div>
    )}
    {(isDeptHead || isFaculty) && allExams.length > 0 && (
      <div className="flex items-center gap-2 mb-4">
        <label className="form-label m-0 whitespace-nowrap">
          Filter by Exam
        </label>
        <select
          className="form-select form-select-sm max-w-xs"
          value={filters.examId}
          onChange={(e) => onFilterExam(e.target.value)}
        >
          <option value="">All exams</option>
          {allExams.map((e) => (
            <option key={e.id} value={e.id}>
              {courseName(e.courseId)} — {formatEnum(e.type)}
            </option>
          ))}
        </select>
      </div>
    )}
  </>
);
