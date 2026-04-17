import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateInput } from "@/components/common/DateInput";
import { ExamType } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import { ZodExamSchema, type IExamForm } from "@/zod/academic/ZodExamSchema";
import type { ICourse, IExam } from "@/types/academicTypes";

export type TExamForm = IExamForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IExam | null;
  courses: ICourse[];
  saving: boolean;
  onSave: (data: TExamForm) => void;
}

export const ExamFormModal = ({
  show,
  onHide,
  selected,
  courses,
  saving,
  onSave,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TExamForm>({
    resolver: zodResolver(ZodExamSchema),
    defaultValues: { courseId: "", type: ExamType.MIDTERM, date: "" },
  });

  const isCreate = !selected;
  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        courseId: selected.courseId,
        type: selected.type,
        date: selected.date,
      });
    } else {
      reset({ courseId: "", type: ExamType.MIDTERM, date: "" });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{selected ? "Edit Exam" : "New Exam"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Course</label>
          <select className="form-select" {...register("courseId")}>
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          {errors.courseId && (
            <p className="text-xs text-danger mt-1">
              {errors.courseId.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="form-label">Type</label>
            <select className="form-select" {...register("type")}>
              {Object.values(ExamType).map((t) => (
                <option key={t} value={t}>
                  {formatEnum(t)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Date</label>
            <Controller
              control={control}
              name="date"
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  min={isCreate ? todayStr : undefined}
                />
              )}
            />
            {errors.date && (
              <p className="text-xs text-danger mt-1">{errors.date.message}</p>
            )}
            {isCreate && (
              <small className="text-xs text-tertiary">
                Must be today or a future date
              </small>
            )}
          </div>
        </div>
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
