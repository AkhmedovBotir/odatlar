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

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'mukofot',
    title: '+50 XP va 10 tanga',
    preview: 'Bugungi amaliyotlarni bajarganingiz uchun mukofot',
    createdAt: '2026-07-05T08:30:00',
    xp: 50,
    coins: 10,
    reason: '5 ta amaliyot bajarildi',
  },
  {
    id: 'n2',
    type: 'reyting',
    title: 'Reytingingiz oshdi!',
    preview: '12-oʻrindan 9-oʻringa koʻtarildingiz',
    createdAt: '2026-07-05T07:15:00',
    oldRank: 12,
    newRank: 9,
    totalUsers: 48,
    delta: 3,
  },
  {
    id: 'n3',
    type: 'eslatma',
    title: 'Ertalabki amaliyot vaqti',
    preview: 'Meditatsiya — soat 07:00 da',
    createdAt: '2026-07-05T06:55:00',
    habitName: 'Meditatsiya',
    scheduledTime: '07:00',
    message: 'Ertalabki meditatsiya vaqti yaqinlashmoqda. Tayyor boʻling!',
  },
  {
    id: 'n4',
    type: 'yutuq',
    title: '7 kunlik seriya!',
    preview: 'Kitob oʻqish — yangi yutuq ochildi',
    createdAt: '2026-07-04T21:00:00',
    streak: 7,
    habitName: 'Kitob oʻqish',
    badgeLabel: 'Haftalik seriya',
    message: '7 kun ketma-ket bajardingiz. Ajoyib natija!',
  },
  {
    id: 'n5',
    type: 'mashq',
    title: 'Dominant mashqi tavsiyasi',
    preview: 'Ijtimoiy tarmoq — signal paydo boʻlishi mumkin',
    createdAt: '2026-07-04T18:20:00',
    dominantTitle: 'Ijtimoiy tarmoqni cheklash',
    cue: 'Charchoq paytida telefonga qarab qolish',
    sessionsCompleted: 3,
    tip: 'Signal paydo boʻlganda darhol 10 daqiqalik mashqni boshlang.',
  },
  {
    id: 'n6',
    type: 'tizim',
    title: 'Yangi versiya: 1.2.0',
    preview: 'Qoʻllanma, bildirishnomalar va yangi dizayn',
    createdAt: '2026-07-03T10:00:00',
    version: '1.2.0',
    features: [
      'Qoʻllanma boʻlimi — kurslar va videolar',
      'Bildirishnomalar tizimi',
      'Mobil navigatsiya yangilandi',
    ],
    actionLabel: "Qo'llanmani ko'rish",
    actionHref: '/qollanma',
  },
];

export function findNotification(id: string): Notification | null {
  return mockNotifications.find((n) => n.id === id) ?? null;
}

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
