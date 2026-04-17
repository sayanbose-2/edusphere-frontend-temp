import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/types/enums";
import {
  ZodDepartmentFormSchema,
  type IDepartmentForm,
} from "@/zod/people/ZodDepartmentSchema";
import type { IDepartment } from "@/types/academicTypes";

export type TDepartmentForm = IDepartmentForm;

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IDepartment | null;
  saving: boolean;
  onSave: (data: TDepartmentForm) => void;
}

export const DepartmentFormModal = ({
  show,
  onHide,
  selected,
  saving,
  onSave,
}: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TDepartmentForm>({
    resolver: zodResolver(ZodDepartmentFormSchema),
    defaultValues: {
      departmentName: "",
      departmentCode: "",
      contactInfo: "",
      status: Status.ACTIVE,
    },
  });

  useEffect(() => {
    if (!show) return;
    if (selected) {
      reset({
        departmentName: selected.departmentName,
        departmentCode: selected.departmentCode,
        contactInfo: selected.contactInfo,
        status: selected.status,
      });
    } else {
      reset({
        departmentName: "",
        departmentCode: "",
        contactInfo: "",
        status: Status.ACTIVE,
      });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>
          {selected ? "Edit Department" : "New Department"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Department Name</label>
          <input
            className="form-control"
            {...register("departmentName")}
            placeholder="e.g. Computer Science"
          />
          {errors.departmentName && (
            <p className="text-xs text-danger mt-1">
              {errors.departmentName.message}
            </p>
          )}
        </div>
        <div className="mb-3.5">
          <label className="form-label">Department Code</label>
          <input
            className="form-control"
            {...register("departmentCode")}
            placeholder="e.g. CS"
          />
          {errors.departmentCode && (
            <p className="text-xs text-danger mt-1">
              {errors.departmentCode.message}
            </p>
          )}
        </div>
        <div className="mb-3.5">
          <label className="form-label">Contact Info</label>
          <input
            className="form-control"
            {...register("contactInfo")}
            placeholder="Email or phone"
          />
          {errors.contactInfo && (
            <p className="text-xs text-danger mt-1">
              {errors.contactInfo.message}
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
