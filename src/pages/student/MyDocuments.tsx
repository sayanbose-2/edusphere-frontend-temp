import { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { BsPlus, BsDownload } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';


enum DocumentType {
  IDPROOF     = 'IDPROOF',
  TRANSCRIPT  = 'TRANSCRIPT',
  MARKSSHEET  = 'MARKSSHEET',
  CERTIFICATE = 'CERTIFICATE',
  OFFERLETTER = 'OFFERLETTER',
  BONAFIDE    = 'BONAFIDE',
  FEE_RECEIPT = 'FEE_RECEIPT',
  OTHER       = 'OTHER',
}

interface StudentDocument {
  studentDocumentId: string;
  studentId: string;
  studentName: string;
  docType: DocumentType;
  downloadUrl: string;
  verificationStatus: boolean;
}


const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.IDPROOF]:     'ID Proof',
  [DocumentType.TRANSCRIPT]:  'Transcript',
  [DocumentType.MARKSSHEET]:  'Marks Sheet',
  [DocumentType.CERTIFICATE]: 'Certificate',
  [DocumentType.OFFERLETTER]: 'Offer Letter',
  [DocumentType.BONAFIDE]:    'Bonafide',
  [DocumentType.FEE_RECEIPT]: 'Fee Receipt',
  [DocumentType.OTHER]:       'Other',
};


const extractFileName = (url: string): string => {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split(/[/\\?#]/);
    return parts.filter(Boolean).pop() ?? url;
  } catch {
    return url;
  }
};


type DocumentRow = StudentDocument & Record<string, unknown>;

export default function MyDocuments() {
  const { user } = useAuth();

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile]           = useState<File | null>(null);
  const [docType, setDocType]     = useState<DocumentType>(DocumentType.TRANSCRIPT);


  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<StudentDocument[]>('/student-documents/me/docs');
      setDocuments(res.data as DocumentRow[]);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.id]);


  const openUpload = () => {
    setFile(null);
    setDocType(DocumentType.TRANSCRIPT);
    setShowModal(true);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    try {
      setUploading(true);

      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', docType);

      await apiClient.post<StudentDocument>('/student-documents/me/upload', fd, {
        headers: {
          'Content-Type': undefined,
        },
      });

      toast.success('Document uploaded successfully');
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? (err instanceof Error ? err.message : 'Failed to upload document');
      console.error('[Upload error]', err);
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────

  const handleDownload = async (doc: DocumentRow) => {
    try {
      const res = await apiClient.get(`/student-documents/download/${doc.studentDocumentId}`, {
        responseType: 'blob',
      });

      const disposition = res.headers['content-disposition'] as string | undefined;
      let filename = extractFileName(doc.downloadUrl) || 'document';
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }

      const mimeType = (res.headers['content-type'] as string | undefined) || 'application/octet-stream';
      const blob = new Blob([res.data], { type: mimeType });
      const url  = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document');
    }
  };


  const columns: Column<DocumentRow>[] = [
    {
      key: 'downloadUrl',
      label: 'File Name',
      render: (item) => (
        <span title={item.downloadUrl}>{extractFileName(item.downloadUrl)}</span>
      ),
    },
    {
      key: 'docType',
      label: 'Document Type',
      render: (item) => DOC_TYPE_LABELS[item.docType as DocumentType] ?? item.docType,
    },
    {
      key: 'verificationStatus',
      label: 'Verification',
      render: (item) => (
        <span className={`badge bg-${item.verificationStatus ? 'success' : 'secondary'}`}>
          {item.verificationStatus ? 'Verified' : 'Pending'}
        </span>
      ),
    },
  ];


  return (
    <div>
      <PageHeader
        title="My Documents"
        subtitle="Upload and manage your documents"
        action={
          <Button variant="primary" size="sm" onClick={openUpload}>
            <BsPlus className="me-1" /> Upload Document
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={documents}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => handleDownload(item)}
              title="Download"
            >
              <BsDownload />
            </Button>
          </div>
        )}
      />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Upload Document</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Document Type</Form.Label>
              <Form.Select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
              >
                {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map((key) => (
                  <option key={key} value={key}>
                    {DOC_TYPE_LABELS[key]}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  setFile(input.files?.[0] ?? null);
                }}
              />
              <Form.Text className="text-muted">
                Accepted formats: PDF, Word (.doc/.docx), TXT, JPG, PNG
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={uploading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

