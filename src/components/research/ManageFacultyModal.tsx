import { Modal } from "react-bootstrap";
import { BsXCircle } from "react-icons/bs";
import type { IResearchProject, IFaculty } from "@/types/academicTypes";

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IResearchProject | null;
  faculties: IFaculty[];
  addId: string;
  onAddIdChange: (id: string) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  saving: boolean;
  facultyName: (id: string) => string;
}

export const ManageFacultyModal = ({
  show,
  onHide,
  selected,
  faculties,
  addId,
  onAddIdChange,
  onAdd,
  onRemove,
  saving,
  facultyName,
}: Props) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Co-Investigators — {selected?.title}</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <div className="mb-4">
        <label className="form-label">Current Co-Investigators</label>
        {selected?.facultyMembersIdList?.length ? (
          <div className="flex flex-col gap-1.5">
            {selected.facultyMembersIdList.map((id) => (
              <div
                key={id}
                className="flex justify-between items-center bg-surface border border-border rounded p-1.5"
              >
                <span className="text-base">{facultyName(id)}</span>
                <button
                  className="icon-btn icon-btn-danger"
                  onClick={() => onRemove(id)}
                >
                  <BsXCircle size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-base text-secondary">
            No co-investigators assigned.
          </p>
        )}
      </div>
      <div className="border-t border-border pt-3.5">
        <label className="form-label">Add Co-Investigator</label>
        <div className="flex gap-2">
          <select
            className="form-select"
            value={addId}
            onChange={(e) => onAddIdChange(e.target.value)}
          >
            <option value="">Select faculty member</option>
            {faculties
              .filter((f) => !selected?.facultyMembersIdList?.includes(f.id))
              .map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
          </select>
          <button
            className="btn btn-primary btn-sm whitespace-nowrap"
            onClick={onAdd}
            disabled={saving || !addId}
          >
            {saving && (
              <span className="spinner-border spinner-border-sm me-2" />
            )}
            Add
          </button>
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer>
      <button className="btn btn-secondary btn-sm" onClick={onHide}>
        Close
      </button>
    </Modal.Footer>
  </Modal>
);
