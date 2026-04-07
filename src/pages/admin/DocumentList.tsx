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

export default function DocumentList() {
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

  const handleToggleVerification = async (item: StudentDocument) => {
    try {
      await documentService.toggleVerification(item.studentDocumentId, !item.verificationStatus);
      toast.success(item.verificationStatus ? 'Document unverified' : 'Document verified');
      fetchData();
    } catch {
      toast.error('Failed to toggle verification');
    }
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.name || '—';

  const columns: Column<StudentDocument>[] = [
    {
      key: 'studentId',
      label: 'Student',
      render: (item) => getStudentName(item.studentId),
    },
    { key: 'docType', label: 'Document Type' },
    {
      key: 'downloadUrl',
      label: 'Download',
      render: (item) => item.downloadUrl ? <a href={item.downloadUrl} target="_blank" rel="noreferrer">Download</a> : '-',
    },
    {
      key: 'verificationStatus',
      label: 'Verified',
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
        title="Student Documents"
        subtitle="View and verify student documents"
      />

      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        actions={(item) => (
          <div className="d-flex gap-1">
            <Button
              variant={item.verificationStatus ? 'outline-warning' : 'outline-success'}
              size="sm"
              onClick={() => handleToggleVerification(item)}
              title={item.verificationStatus ? 'Unverify' : 'Verify'}
            >
              {item.verificationStatus ? <BsX /> : <BsCheck />}
              {item.verificationStatus ? ' Unverify' : ' Verify'}
            </Button>
          </div>
        )}
      />
    </div>
  );
}
