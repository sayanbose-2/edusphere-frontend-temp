import apiClient from '@/api/client';
import type { ResearchProject, CreateResearchProjectRequest } from '@/types/academic.types';

export const researchService = {
  getAll: () =>
    apiClient.get<ResearchProject[]>('/research-projects').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ResearchProject>(`/research-projects/${id}`).then((r) => r.data),

  create: (data: CreateResearchProjectRequest) =>
    apiClient.post<ResearchProject>('/research-projects', data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/research-projects/${id}`),

  addFaculty: (projectId: string, facultyId: string) =>
    apiClient.post(`/research-projects/${projectId}/faculty`, null, { params: { facultyId } }),

  addStudent: (projectId: string, studentId: string) =>
    apiClient.post(`/research-projects/${projectId}/students`, null, { params: { studentId } }),
};
