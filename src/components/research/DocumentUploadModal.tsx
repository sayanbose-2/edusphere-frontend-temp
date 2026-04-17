import { useState } from "react";
import { Modal } from "react-bootstrap";
import { DocumentType } from "@/types/enums";
import { formatEnum } from "@/utils/formatters";

interface IUploadForm {
  file: File | null;
  docType: DocumentType;
}

interface Props {
  show: boolean;
  onHide: () => void;
  uploading: boolean;
  onUpload: (form: IUploadForm) => void;
}

export const DocumentUploadModal = ({
  show,
  onHide,
  uploading,
  onUpload,
}: Props) => {
  const [form, setForm] = useState<IUploadForm>({
    file: null,
    docType: DocumentType.TRANSCRIPT,
  });

  const handleShow = () =>
    setForm({ file: null, docType: DocumentType.TRANSCRIPT });

  return (
    <Modal show={show} onHide={onHide} onShow={handleShow}>
      <Modal.Header closeButton>
        <Modal.Title>Upload Document</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3.5">
          <label className="form-label">Document Type</label>
          <select
            className="form-select"
            value={form.docType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                docType: e.target.value as DocumentType,
              }))
            }
          >
            {Object.values(DocumentType).map((t) => (
              <option key={t} value={t}>
                {formatEnum(t)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">File</label>
          <input
            type="file"
            className="form-control"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
            onChange={(e) =>
              setForm((f) => ({ ...f, file: e.target.files?.[0] ?? null }))
            }
          />
          <div className="text-xs text-secondary mt-1">
            Accepted: PDF, Word, TXT, JPG, PNG
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onHide}
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => onUpload(form)}
          disabled={uploading || !form.file}
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Uploading…
            </>
          ) : (
            "Upload"
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
};
