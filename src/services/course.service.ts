import apiClient from '@/api/client';
import type { Course, CreateCourseRequest, PageResponse } from '@/types/academic.types';
import type { ApiResponse } from '@/types/compliance.types';
import type { Status } from '@/types/enums';

export const courseService = {
  getAll: () =>
    apiClient.get<PageResponse<Course> | Course[]>('/courses').then((r) =>
      Array.isArray(r.data) ? r.data : (r.data.content ?? [])
    ),

  getById: (id: string) =>
    apiClient.get<Course>(`/courses/${id}`).then((r) => r.data),

  create: (data: CreateCourseRequest) =>
    apiClient.post<ApiResponse>('/courses', data).then((r) => r.data),

  update: (id: string, data: CreateCourseRequest) =>
    apiClient.put<ApiResponse>(`/courses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/courses/${id}`),

  // backend expects raw enum string as body: "ACTIVE" | "INACTIVE"
  updateStatus: (id: string, status: Status) =>
    apiClient.put<ApiResponse>(`/courses/${id}/status`, JSON.stringify(status), {
      headers: { 'Content-Type': 'application/json' },
    }),
};
