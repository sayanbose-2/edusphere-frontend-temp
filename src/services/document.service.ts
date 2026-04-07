import apiClient from '@/api/client';
import type { StudentDocument } from '@/types/academic.types';

export const documentService = {
  getAll: () =>
    apiClient.get<StudentDocument[]>('/student-documents/all').then((r) => r.data),

  getByStudent: (studentId: string) =>
    apiClient.get<StudentDocument[]>(`/student-documents/student/${studentId}`).then((r) => r.data),

  toggleVerification: (documentId: string, verified: boolean) =>
    apiClient.patch(`/student-documents/${documentId}/verify`, { verified }),

  upload: (studentId: string, formData: FormData) =>
    apiClient.post(`/student-documents/upload/${studentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
