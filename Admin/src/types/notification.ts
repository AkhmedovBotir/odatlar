export type NotificationType = 'mukofot' | 'reyting' | 'eslatma' | 'tizim' | 'yutuq' | 'mashq'

export type NotificationTarget = 'all' | 'selected'

export type NotificationStatus = 'draft' | 'sent'

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  mukofot: 'Mukofot',
  reyting: 'Reyting',
  eslatma: 'Eslatma',
  tizim: 'Tizim',
  yutuq: 'Yutuq',
  mashq: 'Mashq',
}

export const NOTIFICATION_TYPES = Object.keys(NOTIFICATION_TYPE_LABELS) as NotificationType[]

export type NotificationPayload = Record<string, unknown>

export interface AdminNotification {
  id: string
  type: NotificationType
  title: string
  preview: string
  payload?: NotificationPayload
  target?: NotificationTarget
  targetUserIds?: number[]
  status?: NotificationStatus
  deliveryCount?: number
  sentAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface NotificationListResponse {
  data: AdminNotification[]
}

export interface CreateNotificationRequest {
  type: NotificationType
  title: string
  preview?: string
  payload?: NotificationPayload
  target?: NotificationTarget
  target_user_ids?: number[]
}

export interface UpdateNotificationRequest {
  type: NotificationType
  title: string
  preview?: string
  payload?: NotificationPayload
  target: NotificationTarget
  target_user_ids?: number[]
}

export function defaultPayload(type: NotificationType): NotificationPayload {
  switch (type) {
    case 'mukofot':
      return { xp: 50, coins: 10, reason: '' }
    case 'reyting':
      return { oldRank: 10, newRank: 8, totalUsers: 100, delta: 2 }
    case 'eslatma':
      return { habitName: '', scheduledTime: '07:00', message: '' }
    case 'tizim':
      return { version: '1.0.0', features: [], actionLabel: '', actionHref: '' }
    case 'yutuq':
      return { streak: 7, habitName: '', badgeLabel: '', message: '' }
    case 'mashq':
      return { dominantTitle: '', cue: '', sessionsCompleted: 0, tip: '' }
  }
}

export function parsePayload(raw: unknown): NotificationPayload {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as NotificationPayload
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object') return raw as NotificationPayload
  return {}
}
