import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsPlus, BsDownload } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';

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

interface StudentDocument {
  studentDocumentId: string;
  studentId: string;
  studentName: string;
  docType: DocumentType;
  downloadUrl: string;
  verificationStatus: boolean;
}

type DocumentRow = StudentDocument & Record<string, unknown>;

const extractFileName = (url: string): string => {
  try {
    const decoded = decodeURIComponent(url);
    const parts = decoded.split(/[/\\?#]/);
    return parts.filter(Boolean).pop() ?? url;
  } catch { return url; }
};

export default function MyDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>(DocumentType.TRANSCRIPT);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<StudentDocument[]>('/student-documents/me/docs');
      setDocuments(res.data as DocumentRow[]);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.id]);

  const openUpload = () => { setFile(null); setDocType(DocumentType.TRANSCRIPT); setModal(true); };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('docType', docType);
      await apiClient.post<StudentDocument>('/student-documents/me/upload', fd, { headers: { 'Content-Type': undefined } });
      toast.success('Document uploaded'); setModal(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? (err instanceof Error ? err.message : 'Failed to upload');
      toast.error(msg);
    } finally { setUploading(false); }
  };

  const handleDownload = async (doc: DocumentRow) => {
    try {
      const res = await apiClient.get(`/student-documents/download/${doc.studentDocumentId}`, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] as string | undefined;
      let filename = extractFileName(doc.downloadUrl) || 'document';
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }
      const blob = new Blob([res.data], { type: (res.headers['content-type'] as string) || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = filename;
      document.body.appendChild(link); link.click();
      document.body.removeChild(link); window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download document'); }
  };

  const columns: Column<DocumentRow>[] = [
    { key: 'downloadUrl',        label: 'File',         render: item => <span title={item.downloadUrl}>{extractFileName(item.downloadUrl)}</span> },
    { key: 'docType',            label: 'Type',         render: item => DOC_TYPE_LABELS[item.docType as DocumentType] ?? item.docType },
    { key: 'verificationStatus', label: 'Verification', render: item => <StatusBadge status={item.verificationStatus ? 'VERIFIED' : 'PENDING'} /> },
  ];

  return (
    <>
      <PageHeader title="My Documents" subtitle="Upload and manage your documents"
        action={<button className="btn btn-primary btn-sm" onClick={openUpload}><BsPlus className="me-1" />Upload Document</button>}
      />
      <DataTable columns={columns} data={documents} loading={loading}
        actions={item => (
          <button className="icon-btn" onClick={() => handleDownload(item)} title="Download"><BsDownload size={13} /></button>
        )}
      />

      <Modal show={modal} onHide={() => setModal(false)}>
        <Modal.Header closeButton><Modal.Title>Upload Document</Modal.Title></Modal.Header>
        <Modal.Body>
          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Document Type</label>
            <select className="form-select" value={docType} onChange={e => setDocType(e.target.value as DocumentType)}>
              {(Object.keys(DOC_TYPE_LABELS) as DocumentType[]).map(key => (
                <option key={key} value={key}>{DOC_TYPE_LABELS[key]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">File</label>
            <input type="file" className="form-control" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" onChange={e => setFile((e.target as HTMLInputElement).files?.[0] ?? null)} />
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 4 }}>Accepted: PDF, Word, TXT, JPG, PNG</div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setModal(false)} disabled={uploading}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</> : 'Upload'}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
