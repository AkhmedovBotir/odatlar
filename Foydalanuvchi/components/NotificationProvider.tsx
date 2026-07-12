'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  normalizeNotification,
  notificationsWebSocketUrl,
  type ApiUserNotification,
  type StoredNotification,
} from '@/lib/notificationsApi';
import type { Notification } from '@/lib/notifications';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function readIdsFromItems(items: StoredNotification[]): Set<string> {
  return new Set(items.filter((item) => item.isRead).map((item) => item.id));
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);

  const applyServerList = useCallback((items: StoredNotification[], unread: number) => {
    setNotifications(items);
    setUnreadCount(unread);
    setReadIds(readIdsFromItems(items));
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await fetchNotifications();
        if (!cancelled) {
          applyServerList(result.notifications, result.unreadCount);
        }
      } catch (error) {
        console.error('[NotificationProvider] yuklash xatosi', error);
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyServerList]);

  useEffect(() => {
    const url = notificationsWebSocketUrl();
    if (!url) return;

    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string) as {
          event: string;
          data: unknown;
        };
        if (message.event === 'notification') {
          const raw = message.data as ApiUserNotification;
          const item = normalizeNotification(raw);
          setNotifications((prev) => {
            if (prev.some((n) => n.id === item.id)) return prev;
            return [item, ...prev];
          });
          if (!item.isRead) {
            setUnreadCount((c) => c + 1);
          }
        } else if (message.event === 'unread_count') {
          const data = message.data as { unreadCount: number };
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error('[NotificationProvider] WS xabar xatosi', error);
      }
    };

    socket.onclose = () => {
      socketRef.current = null;
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;
      const next = new Set(readIds);
      next.add(id);
      setReadIds(next);
      setUnreadCount((c) => Math.max(0, c - 1));

      markNotificationRead(id)
        .then(setUnreadCount)
        .catch((error) => console.error('[NotificationProvider] markRead xatosi', error));
    },
    [readIds]
  );

  const markAllRead = useCallback(() => {
    setReadIds(new Set(notifications.map((n) => n.id)));
    setUnreadCount(0);

    markAllNotificationsRead()
      .then(setUnreadCount)
      .catch((error) => console.error('[NotificationProvider] markAllRead xatosi', error));
  }, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isRead,
      markRead,
      markAllRead,
      loading,
    }),
    [notifications, unreadCount, isRead, markRead, markAllRead, loading]
  );

  return (
    <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}
