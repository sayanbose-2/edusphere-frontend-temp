import { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { BsCheck, BsX } from 'react-icons/bs';
import { toast } from 'react-toastify';
import { documentService } from '@/services/document.service';
import { studentService } from '@/services/student.service';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import type { StudentDocument, Student } from '@/types/academic.types';

export default function DocumentVerification() {
  const [items, setItems] = useState<StudentDocument[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [docData, stuData] = await Promise.all([
        documentService.getAll(),
        studentService.getAll(),
      ]);
      setItems(docData);
      setStudents(stuData);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerify = async (item: StudentDocument, verified: boolean) => {
    try {
      await documentService.toggleVerification(item.studentDocumentId, verified);
      toast.success(verified ? 'Document verified' : 'Document unverified');
      fetchData();
    } catch {
      toast.error('Failed to update verification status');
    }
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '—';

  const columns: Column<StudentDocument>[] = [
    {
      key: 'studentId',
      label: 'Student',
      render: (item) => getStudentName(item.studentId),
    },
    {
      key: 'downloadUrl',
      label: 'Document',
      render: (item) => item.downloadUrl ? <a href={item.downloadUrl} target="_blank" rel="noreferrer">Download</a> : '-',
    },
    { key: 'docType', label: 'Document Type' },
    {
      key: 'verificationStatus',
      label: 'Verification Status',
      render: (item) => (
        <span className={`badge bg-${item.verificationStatus ? 'success' : 'secondary'}`}>
          {item.verificationStatus ? 'Verified' : 'Unverified'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Document Verification"
        subtitle="Verify or unverify student documents"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            {item.verificationStatus ? (
              <Button
                variant="outline-warning"
                size="sm"
                onClick={() => handleVerify(item, false)}
                title="Unverify"
              >
                <BsX /> Unverify
              </Button>
            ) : (
              <Button
                variant="outline-success"
                size="sm"
                onClick={() => handleVerify(item, true)}
                title="Verify"
              >
                <BsCheck /> Verify
              </Button>
            )}
          </div>
        )}
      />
    </div>
  );
}
