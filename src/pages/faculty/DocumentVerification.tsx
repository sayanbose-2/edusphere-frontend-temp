import { useState, useEffect } from 'react';
import { BsCheck2, BsXCircle } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { documentService } from '@/services/document.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatEnum } from '@/utils/formatters';
import type { StudentDocument, Student } from '@/types/academic.types';

export default function DocumentVerification() {
  const [items, setItems] = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [docs, stus] = await Promise.all([documentService.getAll(), studentService.getAll()]);
      setItems(docs); setStudents(stus);
    } catch { toast.error('Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleVerify = async (item: StudentDocument, verified: boolean) => {
    try {
      await documentService.toggleVerification(item.studentDocumentId, verified);
      toast.success(verified ? 'Document verified' : 'Document unverified');
      load();
    } catch { toast.error('Failed to update verification'); }
  };

  const columns: Column<StudentDocument>[] = [
    { key: 'studentId',          label: 'Student',     render: item => students.find(s => s.id === item.studentId)?.name ?? '—' },
    { key: 'docType',            label: 'Type',        render: item => formatEnum(item.docType) },
    { key: 'downloadUrl',        label: 'Document',    render: item => item.downloadUrl ? <a href={item.downloadUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--blue)', fontSize: 13 }}>Download</a> : '—' },
    { key: 'verificationStatus', label: 'Status',      render: item => <StatusBadge status={item.verificationStatus ? 'VERIFIED' : 'UNVERIFIED'} /> },
  ];

  return (
    <>
      <PageHeader title="Document Verification" subtitle="Verify or unverify student documents" />
      <DataTable columns={columns} data={items} loading={loading}
        actions={item => (
          item.verificationStatus ? (
            <button className="icon-btn icon-btn-warn" onClick={() => handleVerify(item, false)} title="Unverify"><BsXCircle size={13} /></button>
          ) : (
            <button className="icon-btn icon-btn-success" onClick={() => handleVerify(item, true)} title="Verify"><BsCheck2 size={14} /></button>
          )
        )}
      />
    </>
  );
}
