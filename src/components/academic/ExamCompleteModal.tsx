import { Modal } from "react-bootstrap";
import { BsCheckCircle } from "react-icons/bs";
import { formatEnum } from "@/utils/formatters";
import type { IExam } from "@/types/academicTypes";

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IExam | null;
  courseName: (id: string) => string;
  saving: boolean;
  onConfirm: () => void;
}

export const ExamCompleteModal = ({
  show,
  onHide,
  selected,
  courseName,
  saving,
  onConfirm,
}: Props) => (
  <Modal show={show} onHide={onHide} size="sm" centered>
    <Modal.Body className="p-7 text-center">
      <BsCheckCircle size={32} className="text-success mb-3 mx-auto" />
      <p className="font-semibold mb-1.5">Mark exam as completed?</p>
      <p className="text-base text-secondary mb-1">
        {courseName(selected?.courseId || "")} —{" "}
        {selected && formatEnum(selected.type)}
      </p>
      <p className="text-sm text-tertiary mb-6">
        Grades can be submitted once the exam is marked completed.
      </p>
      <div className="flex gap-2 justify-center">
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-success btn-sm"
          onClick={onConfirm}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Mark Completed
        </button>
      </div>
    </Modal.Body>
  </Modal>
);
