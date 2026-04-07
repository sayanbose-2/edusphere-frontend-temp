import apiClient from '@/api/client';
import type { Course, CreateCourseRequest } from '@/types/academic.types';
import type { ApiResponse } from '@/types/compliance.types';
import type { Status } from '@/types/enums';

export const courseService = {
  getAll: () =>
    apiClient.get<Course[]>('/courses').then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Course>(`/courses/${id}`).then((r) => r.data),

  create: (data: CreateCourseRequest) =>
    apiClient.post<ApiResponse>('/courses', data).then((r) => r.data),

  update: (id: string, data: CreateCourseRequest) =>
    apiClient.put<ApiResponse>(`/courses/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/courses/${id}`),

  // backend now requires { status } body (StatusRequest DTO)
  updateStatus: (id: string, status: Status) =>
    apiClient.put<ApiResponse>(`/courses/${id}/status`, { status }),
};
