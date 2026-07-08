'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { mockNotifications, type Notification } from '@/lib/notifications';

const READ_KEY = 'read_notifications';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isRead: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(READ_KEY);
      if (raw) {
        setReadIds(new Set(JSON.parse(raw) as string[]));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((ids: Set<string>) => {
    localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
    setReadIds(ids);
  }, []);

  const isRead = useCallback((id: string) => readIds.has(id), [readIds]);

  const markRead = useCallback(
    (id: string) => {
      if (readIds.has(id)) return;
      const next = new Set(readIds);
      next.add(id);
      persist(next);
    },
    [readIds, persist]
  );

  const markAllRead = useCallback(() => {
    persist(new Set(mockNotifications.map((n) => n.id)));
  }, [persist]);

  const unreadCount = useMemo(
    () => mockNotifications.filter((n) => !readIds.has(n.id)).length,
    [readIds]
  );

  const value = useMemo(
    () => ({
      notifications: mockNotifications,
      unreadCount,
      isRead,
      markRead,
      markAllRead,
    }),
    [unreadCount, isRead, markRead, markAllRead]
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
