import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formatEnum } from "@/utils/formatters";
import { Status, Role } from "@/types/enums";
import {
  ZodUserCreateSchema,
  ZodUserEditSchema,
  type IUserCreateForm,
  type IUserEditForm,
} from "@/zod/people/ZodUserSchema";
import type { IUser } from "@/types/academicTypes";

export const STAFF_ROLES = [
  Role.ADMIN,
  Role.COMPLIANCE_OFFICER,
  Role.REGULATOR,
];

export type TUserCreateForm = IUserCreateForm;
export type TUserEditForm = IUserEditForm;

interface Props {
  mode: "create" | "edit" | null;
  show: boolean;
  onHide: () => void;
  selected: IUser | null;
  saving: boolean;
  onCreate: (data: TUserCreateForm) => void;
  onSave: (data: TUserEditForm) => void;
}

export const UserFormModal = ({
  mode,
  show,
  onHide,
  selected,
  saving,
  onCreate,
  onSave,
}: Props) => {
  const createForm = useForm<TUserCreateForm>({
    resolver: zodResolver(ZodUserCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: STAFF_ROLES[0],
    },
  });
  const editForm = useForm<TUserEditForm>({
    resolver: zodResolver(ZodUserEditSchema),
    defaultValues: { name: "", phone: "", status: Status.ACTIVE },
  });

  useEffect(() => {
    if (!show) return;
    if (mode === "create") {
      createForm.reset({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: STAFF_ROLES[0],
      });
    } else if (mode === "edit" && selected) {
      editForm.reset({
        name: selected.name,
        phone: selected.phone ?? "",
        status: selected.status,
      });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mode === "create") {
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Create Staff Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Role</label>
            <select className="form-select" {...createForm.register("role")}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {formatEnum(r)}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3.5">
            <label className="form-label">Full Name *</label>
            <input
              className="form-control"
              {...createForm.register("name")}
              placeholder="e.g. Jane Smith"
            />
            {createForm.formState.errors.name && (
              <p className="text-xs text-danger mt-1">
                {createForm.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="mb-3.5">
            <label className="form-label">Email *</label>
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
          <div className="mb-3.5">
            <label className="form-label">Password *</label>
            <input
              type="password"
              className="form-control"
              {...createForm.register("password")}
              placeholder="Temporary password"
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
              placeholder="Optional"
            />
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
            Create Account
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Edit User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Name</label>
          <input className="form-control" {...editForm.register("name")} />
          {editForm.formState.errors.name && (
            <p className="text-xs text-danger mt-1">
              {editForm.formState.errors.name.message}
            </p>
          )}
        </div>
        <div className="mb-3.5">
          <label className="form-label">Email (read-only)</label>
          <input
            className="form-control opacity-60"
            value={selected?.email ?? ""}
            readOnly
          />
        </div>
        <div className="mb-3.5">
          <label className="form-label">Phone</label>
          <input className="form-control" {...editForm.register("phone")} />
          {editForm.formState.errors.phone && (
            <p className="text-xs text-danger mt-1">
              {editForm.formState.errors.phone.message}
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
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={editForm.handleSubmit(onSave)}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Save
        </button>
      </Modal.Footer>
    </Modal>
  );
};
