import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { AuditStatus } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";
import type { IAudit } from "@/types/complianceTypes";

interface IReviewForm {
  findings: string;
  auditStatus: AuditStatus;
}

interface Props {
  show: boolean;
  onHide: () => void;
  selected: IAudit | null;
  saving: boolean;
  onSave: (form: IReviewForm) => void;
}

export const AuditReviewModal = ({
  show,
  onHide,
  selected,
  saving,
  onSave,
}: Props) => {
  const [form, setForm] = useState<IReviewForm>({
    findings: "",
    auditStatus: AuditStatus.PENDING,
  });

  useEffect(() => {
    if (show && selected) {
      setForm({
        findings: selected.findings ?? "",
        auditStatus: selected.status,
      });
    }
  }, [show, selected]);

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Review Audit</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {selected && (
          <div className="mb-4 p-3 bg-base rounded text-base flex gap-6">
            <div>
              <span className="text-secondary">Entity:</span>{" "}
              <strong>{formatEnum(selected.entityType)}</strong>
            </div>
            <div>
              <span className="text-secondary">Scope:</span>{" "}
              <strong>{selected.scope}</strong>
            </div>
          </div>
        )}
        <div className="mb-3.5">
          <label className="form-label">Findings</label>
          <textarea
            className="form-control"
            rows={4}
            value={form.findings}
            onChange={(e) =>
              setForm((f) => ({ ...f, findings: e.target.value }))
            }
            placeholder="Enter audit findings…"
          />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select
            className="form-select"
            value={form.auditStatus}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                auditStatus: e.target.value as AuditStatus,
              }))
            }
          >
            {Object.values(AuditStatus).map((s) => (
              <option key={s} value={s}>
                {formatEnum(s)}
              </option>
            ))}
          </select>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary btn-sm" onClick={onHide}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onSave(form)}
          disabled={saving}
        >
          {saving && <span className="spinner-border spinner-border-sm me-2" />}
          Save Review
        </button>
      </Modal.Footer>
    </Modal>
  );
};
