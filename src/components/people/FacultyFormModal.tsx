import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Status } from "@/types/enums";
import {
  ZodFacultyCreateSchema,
  ZodFacultyEditSchema,
  type IFacultyCreateForm,
  type IFacultyEditForm,
} from "@/zod/people/ZodFacultySchema";
import type { IDepartment, IFaculty } from "@/types/academicTypes";

export type TFacultyCreateForm = IFacultyCreateForm;
export type TFacultyEditForm = IFacultyEditForm;

interface Props {
  mode: "create" | "edit" | null;
  show: boolean;
  onHide: () => void;
  selected: IFaculty | null;
  departments: IDepartment[];
  saving: boolean;
  onCreate: (data: TFacultyCreateForm) => void;
  onEdit: (data: TFacultyEditForm) => void;
}

export const FacultyFormModal = ({
  mode,
  show,
  onHide,
  selected,
  departments,
  saving,
  onCreate,
  onEdit,
}: Props) => {
  const createForm = useForm<TFacultyCreateForm>({
    resolver: zodResolver(ZodFacultyCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      position: "",
      departmentId: "",
    },
  });
  const editForm = useForm<TFacultyEditForm>({
    resolver: zodResolver(ZodFacultyEditSchema),
    defaultValues: { position: "", departmentId: "", status: Status.ACTIVE },
  });

  useEffect(() => {
    if (!show) return;
    if (mode === "create") {
      createForm.reset({
        name: "",
        email: "",
        password: "",
        phone: "",
        position: "",
        departmentId: "",
      });
    } else if (mode === "edit" && selected) {
      editForm.reset({
        departmentId: selected.departmentId,
        position: selected.position,
        status: selected.status,
      });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mode === "create") {
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Add Faculty Member</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-xs text-tertiary bg-bg-2 p-2.5 rounded mb-3.5">
            Step 1 — Account credentials
          </p>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Full Name</label>
              <input
                className="form-control"
                {...createForm.register("name")}
                placeholder="Jane Smith"
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-danger mt-1">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                {...createForm.register("email")}
              />
              {createForm.formState.errors.email && (
                <p className="text-xs text-danger mt-1">
                  {createForm.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-5">
            <div>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                {...createForm.register("password")}
                placeholder="Min. 8 characters"
              />
              {createForm.formState.errors.password && (
                <p className="text-xs text-danger mt-1">
                  {createForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input
                className="form-control"
                {...createForm.register("phone")}
              />
            </div>
          </div>
          <p className="text-xs text-tertiary bg-bg-2 p-2.5 rounded mb-3.5">
            Step 2 — Faculty profile
          </p>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Position</label>
              <input
                className="form-control"
                {...createForm.register("position")}
                placeholder="e.g. Associate Professor"
              />
              {createForm.formState.errors.position && (
                <p className="text-xs text-danger mt-1">
                  {createForm.formState.errors.position.message}
                </p>
              )}
            </div>
          </div>
          <div>
            <label className="form-label">Department</label>
            <select
              className="form-select"
              {...createForm.register("departmentId")}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.departmentName}
                </option>
              ))}
            </select>
            {createForm.formState.errors.departmentId && (
              <p className="text-xs text-danger mt-1">
                {createForm.formState.errors.departmentId.message}
              </p>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={onHide}>
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={createForm.handleSubmit(onCreate)}
            disabled={saving}
          >
            {saving && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            Save
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit Faculty</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="form-label">Position</label>
            <input
              className="form-control"
              {...editForm.register("position")}
              placeholder="e.g. Associate Professor"
            />
            {editForm.formState.errors.position && (
              <p className="text-xs text-danger mt-1">
                {editForm.formState.errors.position.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-select" {...editForm.register("status")}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label className="form-label">Department</label>
          <select
            className="form-select"
            {...editForm.register("departmentId")}
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.departmentName}
              </option>
            ))}
          </select>
          {editForm.formState.errors.departmentId && (
            <p className="text-xs text-danger mt-1">
              {editForm.formState.errors.departmentId.message}
            </p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={editForm.handleSubmit(onEdit)}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};
