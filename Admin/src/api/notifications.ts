import type {
  AdminNotification,
  CreateNotificationRequest,
  NotificationListResponse,
  UpdateNotificationRequest,
} from '../types/notification'
import { apiRequest } from './client'

export async function listNotifications(): Promise<AdminNotification[]> {
  const res = await apiRequest<NotificationListResponse>('/api/v1/bot/notifications')
  return res.data
}

export async function getNotification(id: string): Promise<AdminNotification> {
  return apiRequest<AdminNotification>(`/api/v1/bot/notifications/${id}`)
}

export async function createNotification(body: CreateNotificationRequest): Promise<AdminNotification> {
  return apiRequest<AdminNotification>('/api/v1/bot/notifications', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function updateNotification(
  id: string,
  body: UpdateNotificationRequest,
): Promise<AdminNotification> {
  return apiRequest<AdminNotification>(`/api/v1/bot/notifications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteNotification(id: string): Promise<void> {
  await apiRequest<void>(`/api/v1/bot/notifications/${id}`, { method: 'DELETE' })
}

export async function sendNotification(id: string): Promise<AdminNotification> {
  return apiRequest<AdminNotification>(`/api/v1/bot/notifications/${id}/send`, {
    method: 'POST',
  })
}
