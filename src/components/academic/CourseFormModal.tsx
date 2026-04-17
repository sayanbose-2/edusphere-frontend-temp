import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ZodCourseSchema,
  type ICourseForm,
} from "@/zod/academic/ZodCourseSchema";
import type { ICourse, IDepartment } from "@/types/academicTypes";

export type TCourseForm = ICourseForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: ICourse | null;
  departments: IDepartment[];
  saving: boolean;
  onSave: (data: TCourseForm) => void;
}

export const CourseFormModal = ({
  show,
  onHide,
  selected,
  departments,
  saving,
  onSave,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TCourseForm>({
    resolver: zodResolver(ZodCourseSchema),
    defaultValues: { title: "", departmentId: "", credits: 1, duration: 1 },
  });

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        title: selected.title,
        departmentId: selected.departmentId,
        credits: selected.credits,
        duration: selected.duration,
      });
    } else {
      reset({ title: "", departmentId: "", credits: 1, duration: 1 });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>{selected ? "Edit Course" : "New Course"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            {...register("title")}
            placeholder="Course title"
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1">{errors.title.message}</p>
          )}
        </div>
        <div className="mb-3.5">
          <label className="form-label">Department</label>
          <select className="form-select" {...register("departmentId")}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </select>
          {errors.departmentId && (
            <p className="text-xs text-danger mt-1">
              {errors.departmentId.message}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="form-label">Credits</label>
            <input
              type="number"
              className="form-control"
              {...register("credits", { valueAsNumber: true })}
              min={1}
            />
            {errors.credits && (
              <p className="text-xs text-danger mt-1">
                {errors.credits.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Duration (semesters)</label>
            <input
              type="number"
              className="form-control"
              {...register("duration", { valueAsNumber: true })}
              min={1}
            />
            {errors.duration && (
              <p className="text-xs text-danger mt-1">
                {errors.duration.message}
              </p>
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
