import apiClient from '@/api/client';
import type {
  Notification,
  SendNotificationRequest,
  BroadcastNotificationRequest,
} from '@/types/compliance.types';
import type { PageResponse } from '@/types/academic.types';
import { NotificationType } from '@/types/enums';

export const notificationService = {
  getByUser: (userId: string) =>
    apiClient.get<PageResponse<Notification>>(`/notifications/${userId}`).then((r) => r.data.content ?? []),

  markAsRead: (notificationId: string) =>
    apiClient.patch(`/notifications/${notificationId}/read`),

  markAllAsRead: (userId: string) =>
    apiClient.patch(`/notifications/${userId}/read-all`),

  sendToUser: (userId: string, data: SendNotificationRequest) =>
    apiClient.post(`/notifications/send/user/${userId}`, data),

  sendToRole: (role: string, data: { message: string; category: NotificationType }) =>
    apiClient.post(`/notifications/send/role/${role}`, data),

  broadcast: (data: BroadcastNotificationRequest) =>
    apiClient.post('/notifications/send/all', data),
};
