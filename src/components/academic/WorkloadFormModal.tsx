import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/types/enums";
import {
  ZodWorkloadFormSchema,
  type IWorkloadForm,
} from "@/zod/academic/ZodWorkloadSchema";
import type { ICourse, IFaculty, IWorkload } from "@/types/academicTypes";

export type TWorkloadForm = IWorkloadForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IWorkload | null;
  faculties: IFaculty[];
  courses: ICourse[];
  isFaculty: boolean;
  saving: boolean;
  onSave: (data: TWorkloadForm) => void;
}

export const WorkloadFormModal = ({
  show,
  onHide,
  selected,
  faculties,
  courses,
  isFaculty,
  saving,
  onSave,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TWorkloadForm>({
    resolver: zodResolver(ZodWorkloadFormSchema),
    defaultValues: {
      facultyId: "",
      courseId: "",
      semester: "",
      hours: 0,
      status: Status.ACTIVE,
    },
  });

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        facultyId: selected.facultyId,
        courseId: selected.courseId,
        hours: selected.hours,
        semester: selected.semester,
        status: selected.status,
      });
    } else {
      reset({
        facultyId: "",
        courseId: "",
        semester: "",
        hours: 0,
        status: Status.ACTIVE,
      });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          {selected ? "Edit Workload" : "Assign Workload"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isFaculty && (
          <div className="mb-3.5">
            <label className="form-label">Faculty</label>
            <select className="form-select" {...register("facultyId")}>
              <option value="">Select faculty member</option>
              {faculties.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            {errors.facultyId && (
              <p className="text-xs text-danger mt-1">
                {errors.facultyId.message}
              </p>
            )}
          </div>
        )}
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
        <div className="grid grid-cols-3 gap-3.5">
          <div>
            <label className="form-label">Hours / Week</label>
            <input
              type="number"
              className="form-control"
              {...register("hours", { valueAsNumber: true })}
              min={0}
            />
            {errors.hours && (
              <p className="text-xs text-danger mt-1">{errors.hours.message}</p>
            )}
          </div>
          <div>
            <label className="form-label">Semester</label>
            <input
              className="form-control"
              {...register("semester")}
              placeholder="e.g. Fall 2025"
            />
            {errors.semester && (
              <p className="text-xs text-danger mt-1">
                {errors.semester.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
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
