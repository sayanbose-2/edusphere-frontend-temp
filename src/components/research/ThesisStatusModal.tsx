import { Modal } from "react-bootstrap";
import { ThesisStatus } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { IThesis } from "@/types/academicTypes";

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IThesis | null;
  statusValue: ThesisStatus;
  onStatusChange: (s: ThesisStatus) => void;
  studentName: (id: string) => string;
  saving: boolean;
  onSave: () => void;
}

export const ThesisStatusModal = ({
  show,
  onHide,
  selected,
  statusValue,
  onStatusChange,
  studentName,
  saving,
  onSave,
}: Props) => (
  <Modal show={show} onHide={onHide}>
    <Modal.Header closeButton>
      <Modal.Title>Update Thesis Status</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {selected && (
        <div className="bg-surface border border-border rounded p-3.5 text-sm mb-4">
          <div className="font-semibold mb-1">{selected.title}</div>
          <div className="text-secondary">
            Student: {studentName(selected.studentId)}
          </div>
        </div>
      )}
      <label className="form-label">Status</label>
      <select
        className="form-select"
        value={statusValue}
        onChange={(e) => onStatusChange(e.target.value as ThesisStatus)}
      >
        {Object.values(ThesisStatus).map((s) => (
          <option key={s} value={s}>
            {formatEnum(s)}
          </option>
        ))}
      </select>
    </Modal.Body>
    <Modal.Footer>
      <button className="btn btn-secondary btn-sm" onClick={onHide}>
        Cancel
      </button>
      <button
        className="btn btn-primary btn-sm"
        onClick={onSave}
        disabled={saving}
      >
        {saving && <span className="spinner-border spinner-border-sm me-2" />}
        Update
      </button>
    </Modal.Footer>
  </Modal>
);
