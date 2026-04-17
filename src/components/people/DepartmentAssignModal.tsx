import { Modal } from "react-bootstrap";
import type { IDepartment, IFaculty } from "@/types/academicTypes";

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IDepartment | null;
  faculties: IFaculty[];
  headId: string;
  onHeadIdChange: (id: string) => void;
  saving: boolean;
  onAssign: () => void;
}

export const DepartmentAssignModal = ({
  show,
  onHide,
  selected,
  faculties,
  headId,
  onHeadIdChange,
  saving,
  onAssign,
}: Props) => {
  const deptFaculties = faculties.filter(
    (f) => f.departmentId === selected?.id,
  );

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Assign Department Head</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-xs text-secondary mb-3.5">
          Assign head for <strong>{selected?.departmentName}</strong>
        </p>
        <label className="form-label">Select Faculty</label>
        <select
          className="form-select"
          value={headId}
          onChange={(e) => onHeadIdChange(e.target.value)}
        >
          <option value="">Select faculty member</option>
          {deptFaculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
              {f.id === selected?.headId ? " (current head)" : ""}
            </option>
          ))}
        </select>
        {deptFaculties.length === 0 && (
          <p className="text-xs text-tertiary mt-2">
            No faculty in this department yet. Add faculty first.
          </p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={onAssign}
          disabled={saving}
        >
          Assign
        </button>
      </Modal.Footer>
    </Modal>
  );
};
