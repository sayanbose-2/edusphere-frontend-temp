import { useState, useEffect } from 'react';
import { BsCheck2, BsXCircle, BsDownload } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { documentService } from '@/services/document.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { formatEnum } from '@/utils/formatters';
import type { Column } from '@/components/ui/DataTable';
import type { StudentDocument, Student } from '@/types/academic.types';

export default function DocumentList() {
  const [items, setItems] = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [docs, studs] = await Promise.all([documentService.getAll(), studentService.getAll()]);
      setItems(docs); setStudents(studs);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404 && status !== 500) toast.error('Failed to load documents');
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (item: StudentDocument) => {
    try {
      await documentService.toggleVerification(item.studentDocumentId, !item.verificationStatus);
      toast.success(item.verificationStatus ? 'Document unverified' : 'Document verified');
      load();
    } catch { toast.error('Failed to toggle verification'); }
  };

  const studentName = (id: string) => students.find(s => s.id === id)?.name ?? '—';

  const columns: Column<StudentDocument>[] = [
    { key: 'studentId',          label: 'Student',       render: item => studentName(item.studentId) },
    { key: 'docType',            label: 'Document Type', render: item => formatEnum(item.docType) },
    { key: 'verificationStatus', label: 'Verified',
      render: item => (
        <span className={`inline-flex items-center gap-1.25 text-sm font-semibold px-2.5 py-0.5 rounded-full ${item.verificationStatus ? 'bg-success/10 text-success' : 'bg-secondary-100 text-secondary-500'}`}>
          {item.verificationStatus ? 'Verified' : 'Unverified'}
        </span>
      )
    },
  ];

  return (
    <>
      <PageHeader title="Student Documents" subtitle="View and verify uploaded documents" />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          <div className="flex gap-1.5">
            {item.downloadUrl && (
              <a href={item.downloadUrl} target="_blank" rel="noreferrer" className="icon-btn" title="Download">
                <BsDownload size={13} />
              </a>
            )}
            <button
              className={`icon-btn ${item.verificationStatus ? 'icon-btn-warn' : 'icon-btn-success'}`}
              onClick={() => handleToggle(item)}
              title={item.verificationStatus ? 'Unverify' : 'Verify'}
            >
              {item.verificationStatus ? <BsXCircle size={13} /> : <BsCheck2 size={13} />}
            </button>
          </div>
        )}
      />
    </>
  );
}
