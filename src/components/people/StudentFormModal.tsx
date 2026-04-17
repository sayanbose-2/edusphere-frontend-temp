import { useEffect } from "react";
import { Modal } from "react-bootstrap";
import { BsInfoCircle } from "react-icons/bs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DateInput, today } from "@/components/common/DateInput";
import { Gender } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import {
  ZodStudentCreateSchema,
  ZodStudentEditSchema,
  type IStudentCreateForm,
  type IStudentEditForm,
} from "@/zod/people/ZodStudentSchema";
import type { IStudent } from "@/types/academicTypes";

export type TStudentCreateForm = IStudentCreateForm;
export type TStudentEditForm = IStudentEditForm;

interface Props {
  mode: "create" | "edit" | null;
  show: boolean;
  onHide: () => void;
  selected: IStudent | null;
  saving: boolean;
  onCreate: (data: TStudentCreateForm) => void;
  onEdit: (data: TStudentEditForm) => void;
}

export const StudentFormModal = ({
  mode,
  show,
  onHide,
  selected,
  saving,
  onCreate,
  onEdit,
}: Props) => {
  const createForm = useForm<TStudentCreateForm>({
    resolver: zodResolver(ZodStudentCreateSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });
  const editForm = useForm<TStudentEditForm>({
    resolver: zodResolver(ZodStudentEditSchema),
    defaultValues: { dob: "", gender: "", address: "" },
  });

  useEffect(() => {
    if (!show) return;
    if (mode === "create") {
      createForm.reset({ name: "", email: "", password: "", phone: "" });
    } else if (mode === "edit" && selected) {
      editForm.reset({
        dob: selected.dob ?? "",
        gender: selected.gender ?? "",
        address: selected.address ?? "",
      });
    }
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  if (mode === "create") {
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Add Student Account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="flex gap-2.5 items-start rounded-lg p-3 mb-5 text-sm border bg-bg-2 border-border text-secondary">
            <BsInfoCircle
              size={15}
              className="flex-shrink-0 mt-0.5 text-blue"
            />
            <span>
              Create the login account and share credentials. The student fills
              in personal details on first login.
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3.5 mb-3.5">
            <div>
              <label className="form-label">Full Name *</label>
              <input
                className="form-control"
                {...createForm.register("name")}
                placeholder="Student name"
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-danger mt-1">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
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
          </div>
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="form-label">Password *</label>
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
        <Modal.Title>Edit Student — {selected?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="rounded p-3.5 mb-4.5 text-sm border border-border bg-bg-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-tertiary">Name</span>
              <br />
              <span className="font-medium">{selected?.name}</span>
            </div>
            <div>
              <span className="text-xs text-tertiary">Email</span>
              <br />
              <span className="font-medium">{selected?.email}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5 mb-3.5">
          <div>
            <label className="form-label">Date of Birth</label>
            <Controller
              control={editForm.control}
              name="dob"
              render={({ field }) => (
                <DateInput
                  value={field.value}
                  onChange={field.onChange}
                  max={today}
                />
              )}
            />
            {editForm.formState.errors.dob && (
              <p className="text-xs text-danger mt-1">
                {editForm.formState.errors.dob.message}
              </p>
            )}
          </div>
          <div>
            <label className="form-label">Gender</label>
            <select className="form-select" {...editForm.register("gender")}>
              <option value="">Select</option>
              {Object.values(Gender).map((g) => (
                <option key={g} value={g}>
                  {formatEnum(g)}
                </option>
              ))}
            </select>
            {editForm.formState.errors.gender && (
              <p className="text-xs text-danger mt-1">
                {editForm.formState.errors.gender.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="form-label">Address</label>
          <textarea
            className="form-control"
            rows={2}
            {...editForm.register("address")}
          />
          {editForm.formState.errors.address && (
            <p className="text-xs text-danger mt-1">
              {editForm.formState.errors.address.message}
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
          Save Changes
        </button>
      </Modal.Footer>
    </Modal>
  );
};
