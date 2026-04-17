import { Modal } from "react-bootstrap";

interface IProps {
  show: boolean;
  label?: string;
  onClose: () => void;
  onConfirm: () => void;
  saving?: boolean;
}

const DeleteModal = ({ show, label, onClose, onConfirm, saving }: IProps) => {
  return (
    <Modal show={show} onHide={onClose} size="sm">
      <Modal.Body className="p-7 text-center">
        <p className="font-semibold mb-1.5">
          {label ? `Delete "${label}"?` : "Delete this record?"}
        </p>
        <p className="text-sm text-secondary mb-6">This cannot be undone.</p>
        <div className="flex gap-2 justify-center">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={onConfirm}
            disabled={saving}
          >
            Delete
          </button>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteModal;
