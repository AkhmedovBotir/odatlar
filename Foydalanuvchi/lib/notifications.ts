export type NotificationType = 'mukofot' | 'reyting' | 'eslatma' | 'tizim' | 'yutuq' | 'mashq';

interface NotificationBase {
  id: string;
  title: string;
  preview: string;
  createdAt: string;
}

export type Notification =
  | (NotificationBase & {
      type: 'mukofot';
      xp: number;
      coins: number;
      reason: string;
    })
  | (NotificationBase & {
      type: 'reyting';
      oldRank: number;
      newRank: number;
      totalUsers: number;
      delta: number;
    })
  | (NotificationBase & {
      type: 'eslatma';
      habitName: string;
      scheduledTime: string;
      message: string;
    })
  | (NotificationBase & {
      type: 'tizim';
      version: string;
      features: string[];
      actionLabel?: string;
      actionHref?: string;
    })
  | (NotificationBase & {
      type: 'yutuq';
      streak: number;
      habitName: string;
      badgeLabel: string;
      message: string;
    })
  | (NotificationBase & {
      type: 'mashq';
      dominantTitle: string;
      cue: string;
      sessionsCompleted: number;
      tip: string;
    });

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  mukofot: 'Mukofot',
  reyting: 'Reyting',
  eslatma: 'Eslatma',
  tizim: 'Tizim',
  yutuq: 'Yutuq',
  mashq: 'Mashq',
};

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'Hozirgina';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  if (diffHour < 24) return `${diffHour} soat oldin`;
  if (diffDay < 7) return `${diffDay} kun oldin`;

  const day = date.getDate();
  const months = [
    'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
    'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
  ];
  return `${day}-${months[date.getMonth()]}`;
}
