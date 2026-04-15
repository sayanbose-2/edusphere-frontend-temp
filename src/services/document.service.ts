import apiClient from '@/api/client';
import type { StudentDocument, PageResponse } from '@/types/academic.types';

export const documentService = {
  getAll: () =>
    apiClient.get<PageResponse<StudentDocument>>('/student-documents/all').then((r) => r.data.content ?? []),

  getByStudent: (studentId: string) =>
    apiClient.get<PageResponse<StudentDocument>>(`/student-documents/student/${studentId}`).then((r) => r.data.content ?? []),

  toggleVerification: (documentId: string, verified: boolean) =>
    apiClient.patch(`/student-documents/${documentId}/verify`, { verified }),

  upload: (studentId: string, formData: FormData) =>
    apiClient.post(`/student-documents/upload/${studentId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
