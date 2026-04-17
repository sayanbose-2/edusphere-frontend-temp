import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateInput } from "@/components/common/DateInput";
import { ThesisStatus } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodThesisFormSchema,
  type IThesisForm,
} from "@/zod/research/ZodThesisSchema";
import type { IFaculty, IStudent, IThesis } from "@/types/academicTypes";

export type TThesisForm = IThesisForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IThesis | null;
  students: IStudent[];
  faculties: IFaculty[];
  isStudent: boolean;
  isAdmin: boolean;
  myStudentId: string;
  saving: boolean;
  onSave: (data: TThesisForm) => void;
}

export const ThesisFormModal = ({
  show,
  onHide,
  selected,
  students,
  faculties,
  isStudent,
  isAdmin,
  myStudentId,
  saving,
  onSave,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<TThesisForm>({
    resolver: zodResolver(ZodThesisFormSchema),
    defaultValues: {
      studentId: "",
      title: "",
      submissionDate: new Date().toISOString().split("T")[0],
      supervisorId: "",
      status: ThesisStatus.SUBMITTED,
    },
  });

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        studentId: selected.studentId,
        title: selected.title,
        submissionDate: selected.submissionDate,
        supervisorId: selected.supervisorId,
        status: selected.status,
      });
    } else {
      reset({
        studentId: isStudent ? myStudentId : "",
        title: "",
        submissionDate: new Date().toISOString().split("T")[0],
        supervisorId: "",
        status: ThesisStatus.SUBMITTED,
      });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {selected
            ? "Edit Thesis"
            : isStudent
              ? "Submit New Thesis"
              : "Add Thesis"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!isStudent && (
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Student</label>
              <select className="form-select" {...register("studentId")}>
                <option value="">Select student</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Supervisor</label>
              <select className="form-select" {...register("supervisorId")}>
                <option value="">Select supervisor</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {errors.supervisorId && (
                <p className="text-xs text-danger mt-1">
                  {errors.supervisorId.message}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="mb-3.5">
          <label className="form-label">Title</label>
          <input
            className="form-control"
            {...register("title")}
            placeholder="Thesis title"
          />
          {errors.title && (
            <p className="text-xs text-danger mt-1">{errors.title.message}</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="form-label">Submission Date</label>
            <Controller
              control={control}
              name="submissionDate"
              render={({ field }) => (
                <DateInput value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.submissionDate && (
              <p className="text-xs text-danger mt-1">
                {errors.submissionDate.message}
              </p>
            )}
          </div>
          {isStudent && (
            <div>
              <label className="form-label">Supervisor</label>
              <select className="form-select" {...register("supervisorId")}>
                <option value="">Select supervisor</option>
                {faculties.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              {errors.supervisorId && (
                <p className="text-xs text-danger mt-1">
                  {errors.supervisorId.message}
                </p>
              )}
            </div>
          )}
          {isAdmin && (
            <div>
              <label className="form-label">Status</label>
              <select className="form-select" {...register("status")}>
                {Object.values(ThesisStatus).map((s) => (
                  <option key={s} value={s}>
                    {formatEnum(s)}
                  </option>
                ))}
              </select>
            </div>
          )}
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
          {isStudent ? "Submit" : "Save"}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
