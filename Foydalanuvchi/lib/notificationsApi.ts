import { runtimeConfig } from '@/lib/runtimeConfig';
import { getTelegramInitData } from '@/lib/telegramWebApp';
import type { Notification, NotificationType } from '@/lib/notifications';

const LOG_PREFIX = '[NotificationsAPI]';

interface ApiUserNotification {
  id: string;
  type: NotificationType;
  title: string;
  preview: string;
  createdAt: string;
  isRead: boolean;
  payload?: Record<string, unknown>;
}

interface UserNotificationListResponse {
  data: ApiUserNotification[];
  unreadCount: number;
}

interface UnreadCountResponse {
  unreadCount: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const initData = getTelegramInitData();
  if (!initData) {
    throw new Error('Telegram initData topilmadi');
  }

  const response = await fetch(`${runtimeConfig.botApiBase}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Telegram-Init-Data': initData,
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${path} failed: ${response.status} ${text}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type StoredNotification = Notification & { isRead?: boolean };

export function normalizeNotification(item: ApiUserNotification): StoredNotification {
  const payload = item.payload ?? {};
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    preview: item.preview,
    createdAt: item.createdAt,
    isRead: item.isRead,
    ...payload,
  } as StoredNotification;
}

export async function fetchNotifications(): Promise<{
  notifications: StoredNotification[];
  unreadCount: number;
}> {
  console.log(`${LOG_PREFIX} GET /notifications`);
  const result = await request<UserNotificationListResponse>('/bot-runtime/notifications');
  return {
    notifications: result.data.map((item) => normalizeNotification(item)),
    unreadCount: result.unreadCount,
  };
}

export async function markNotificationRead(id: string): Promise<number> {
  console.log(`${LOG_PREFIX} POST /notifications/${id}/read`);
  const result = await request<UnreadCountResponse>(`/bot-runtime/notifications/${id}/read`, {
    method: 'POST',
  });
  return result.unreadCount;
}

export async function markAllNotificationsRead(): Promise<number> {
  console.log(`${LOG_PREFIX} POST /notifications/read-all`);
  const result = await request<UnreadCountResponse>('/bot-runtime/notifications/read-all', {
    method: 'POST',
  });
  return result.unreadCount;
}

export function notificationsWebSocketUrl(): string {
  const initData = getTelegramInitData();
  if (!initData) return '';

  const httpBase = runtimeConfig.botApiBase.replace(/\/api\/v1\/?$/, '');
  const wsBase = httpBase.replace(/^http/, 'ws');
  return `${wsBase}/api/v1/bot-runtime/ws/notifications?initData=${encodeURIComponent(initData)}`;
}

export type { ApiUserNotification, UserNotificationListResponse };
