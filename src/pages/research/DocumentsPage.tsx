import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { BsCheck2, BsXCircle, BsDownload, BsPlus } from 'react-icons/bs';
import { toast } from 'react-toastify';
import apiClient from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Role, DocumentType } from '@/types/enums';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/common/DataTable';
import type { IStudentDocument, IStudent, IPageResponse } from '@/types/academicTypes';

const extractFileName = (url: string) => {
  try {
    const decoded = decodeURIComponent(url);
    return decoded.split(/[/\\?#]/).filter(Boolean).pop() ?? url;
  } catch { return url; }
};

const EMPTY_FORM = { file: null as File | null, docType: DocumentType.TRANSCRIPT };
const EMPTY_DATA = { items: [] as IStudentDocument[], students: [] as IStudent[] };

const DocumentsPage = () => {
  const { user } = useAuth();
  const isStudent = user?.roles.includes(Role.STUDENT) ?? false;
  const isFaculty = user?.roles.includes(Role.FACULTY) ?? false;

  const [data, setData] = useState(EMPTY_DATA);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      if (isStudent) {
        const res = await apiClient.get<IPageResponse<IStudentDocument> | IStudentDocument[]>('/student-documents/me/docs');
        setData(d => ({ ...d, items: Array.isArray(res.data) ? res.data : (res.data.content ?? []) }));
      } else {
        const [docs, studs] = await Promise.all([
          apiClient.get<IPageResponse<IStudentDocument>>('/student-documents/all').then(r => r.data.content ?? []),
          apiClient.get<IPageResponse<IStudent>>('/students').then(r => r.data.content ?? []),
        ]);
        setData({ items: docs, students: studs });
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load documents');
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user?.id]);

  const handleToggleVerify = async (item: IStudentDocument) => {
    try {
      await apiClient.patch(`/student-documents/${item.studentDocumentId}/verify`, { verified: !item.verificationStatus });
      toast.success(item.verificationStatus ? 'Document unverified' : 'Document verified');
      load();
    } catch { toast.error('Failed to update verification'); }
  };

  const handleDownload = async (item: IStudentDocument) => {
    try {
      const res = await apiClient.get(`/student-documents/download/${item.studentDocumentId}`, { responseType: 'blob' });
      const disposition = res.headers['content-disposition'] as string | undefined;
      let filename = extractFileName(item.downloadUrl) || 'document';
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].replace(/"/g, ''));
      }
      const blob = new Blob([res.data], { type: res.headers['content-type'] as string || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download document'); }
  };

  const handleUpload = async () => {
    if (!form.file) { toast.error('Please select a file'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', form.file);
      fd.append('docType', form.docType);
      await apiClient.post('/student-documents/me/upload', fd, { headers: { 'Content-Type': undefined } });
      toast.success('Document uploaded'); setUploadModal(false); load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to upload';
      toast.error(msg);
    } finally { setUploading(false); }
  };

  const studentName = (id: string) => data.students.find(s => s.id === id)?.name ?? '—';

  const columns: Column<IStudentDocument>[] = [
    ...(!isStudent ? [{ key: 'studentId' as const, label: 'Student', render: (item: IStudentDocument) => studentName(item.studentId) }] : []),
    { key: 'docType',            label: 'Type',    render: item => formatEnum(item.docType) },
    ...(!isStudent ? [{ key: 'downloadUrl' as const, label: 'Document', render: (item: IStudentDocument) => item.downloadUrl ? <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="text-blue text-sm">Download</a> : '—' }] : [
      { key: 'downloadUrl' as const, label: 'File', render: (item: IStudentDocument) => <span title={item.downloadUrl}>{extractFileName(item.downloadUrl)}</span> }
    ]),
    { key: 'verificationStatus', label: 'Verified', render: item => <StatusBadge status={item.verificationStatus ? 'VERIFIED' : 'UNVERIFIED'} /> },
  ];

  return (
    <>
      <PageHeader
        title={isStudent ? 'My Documents' : 'Student Documents'}
        subtitle={isStudent ? 'Upload and manage your documents' : isFaculty ? 'Verify or unverify student documents' : 'View and verify all student documents'}
        action={isStudent ? (
          <button className="btn btn-primary btn-sm" onClick={() => { setForm(EMPTY_FORM); setUploadModal(true); }}><BsPlus className="me-1" />Upload Document</button>
        ) : undefined}
      />
      <DataTable columns={columns} data={data.items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            {isStudent && (
              <button className="icon-btn" onClick={() => handleDownload(item)} title="Download"><BsDownload size={13} /></button>
            )}
            {!isStudent && (
              item.verificationStatus
                ? <button className="icon-btn icon-btn-warn" onClick={() => handleToggleVerify(item)} title="Unverify"><BsXCircle size={13} /></button>
                : <button className="icon-btn icon-btn-success" onClick={() => handleToggleVerify(item)} title="Verify"><BsCheck2 size={14} /></button>
            )}
          </div>
        )}
      />

      <Modal show={uploadModal} onHide={() => setUploadModal(false)}>
        <Modal.Header closeButton><Modal.Title>Upload Document</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3.5">
            <label className="form-label">Document Type</label>
            <select className="form-select" value={form.docType} onChange={e => setForm(f => ({ ...f, docType: e.target.value as DocumentType }))}>
              {Object.values(DocumentType).map(t => <option key={t} value={t}>{formatEnum(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">File</label>
            <input type="file" className="form-control" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              onChange={e => setForm(f => ({ ...f, file: e.target.files?.[0] ?? null }))} />
            <div className="text-xs text-secondary mt-1">Accepted: PDF, Word, TXT, JPG, PNG</div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary btn-sm" onClick={() => setUploadModal(false)} disabled={uploading}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleUpload} disabled={uploading || !form.file}>
            {uploading ? <><span className="spinner-border spinner-border-sm me-2" />Uploading…</> : 'Upload'}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default DocumentsPage;
