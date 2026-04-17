import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { GradeStatus } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodGradeFormSchema,
  type IGradeForm,
} from "@/zod/grade/ZodGradeSchema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { IExam, IStudent } from "@/types/academicTypes";

type TForm = IGradeForm;

interface Props {
  show: boolean;
  onHide: () => void;
  mode: "create" | "edit" | null;
  defaultValues: TForm;
  completedExams: IExam[];
  students: IStudent[];
  courseName: (id: string) => string;
  calcGrade: (score: number) => { letter: string; status: GradeStatus };
  onSave: (data: TForm) => Promise<void>;
  saving: boolean;
}

export const GradeFormModal = ({
  show,
  onHide,
  mode,
  defaultValues,
  completedExams,
  students,
  courseName,
  calcGrade,
  onSave,
  saving,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TForm>({
    resolver: zodResolver(ZodGradeFormSchema),
    defaultValues,
  });

  useEffect(() => {
    if (show) reset(defaultValues);
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScoreChange = (val: number) => {
    setValue("score", val);
    const calc = calcGrade(val);
    setValue("grade", calc.letter);
    setValue("gradeStatus", calc.status);
  };

  const scoreVal = watch("score");

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === "edit" ? "Edit Grade" : "Submit Grade"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">
            Exam{" "}
            <span className="text-xs text-tertiary">
              (completed exams only)
            </span>
          </label>
          <select className="form-select" {...register("examId")}>
            <option value="">Select completed exam</option>
            {completedExams.map((e) => (
              <option key={e.id} value={e.id}>
                {courseName(e.courseId)} — {formatEnum(e.type)} (
                {new Date(e.date).toLocaleDateString()})
              </option>
            ))}
          </select>
          {errors.examId && (
            <p className="text-xs text-danger mt-1">{errors.examId.message}</p>
          )}
        </div>
        <div className="mb-3.5">
          <label className="form-label">Student</label>
          <select className="form-select" {...register("studentId")}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.studentId && (
            <p className="text-xs text-danger mt-1">
              {errors.studentId.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3.5">
          <div>
            <label className="form-label">
              Score <span className="text-xs text-tertiary">(0–100)</span>
            </label>
            <input
              type="number"
              className="form-control"
              value={scoreVal}
              onChange={(e) => handleScoreChange(Number(e.target.value))}
              min={0}
              max={100}
            />
            {errors.score && (
              <p className="text-xs text-danger mt-1">{errors.score.message}</p>
            )}
          </div>
          <div>
            <label className="form-label">Grade Letter</label>
            <select className="form-select" {...register("grade")}>
              <option value="">Select</option>
              {["A", "B", "C", "D", "F"].map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            {errors.grade && (
              <p className="text-xs text-danger mt-1">{errors.grade.message}</p>
            )}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register("gradeStatus")}>
              {Object.values(GradeStatus).map((s) => (
                <option key={s} value={s}>
                  {formatEnum(s)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <small className="text-xs text-tertiary mt-1.5 block">
          Grade and status are auto-calculated from score. You can override
          manually.
        </small>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit(onSave)}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};
