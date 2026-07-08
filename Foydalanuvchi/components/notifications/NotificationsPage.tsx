'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Award,
  Bell,
  Brain,
  CheckCheck,
  Gift,
  Settings,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import { useNotifications } from '@/components/NotificationProvider';
import NotificationModal from '@/components/notifications/NotificationModal';
import {
  NOTIFICATION_TYPE_LABELS,
  formatNotificationTime,
  type Notification,
  type NotificationType,
} from '@/lib/notifications';

const typeIcons: Record<NotificationType, typeof Bell> = {
  mukofot: Gift,
  reyting: TrendingUp,
  eslatma: Bell,
  tizim: Settings,
  yutuq: Trophy,
  mashq: Brain,
};

const typeColors: Record<NotificationType, string> = {
  mukofot: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
  reyting: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
  eslatma: 'text-orange-400 bg-orange-950/40 border-orange-800/40',
  tizim: 'text-slate-300 bg-slate-800/60 border-slate-600/40',
  yutuq: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
  mashq: 'text-violet-400 bg-violet-950/40 border-violet-800/40',
};

function NotificationRow({
  notification,
  unread,
  onClick,
  index,
}: {
  notification: Notification;
  unread: boolean;
  onClick: () => void;
  index: number;
}) {
  const Icon = typeIcons[notification.type];
  const color = typeColors[notification.type];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-colors hover:bg-slate-800/60 ${
        unread
          ? 'border-blue-800/40 bg-blue-950/15'
          : 'border-slate-700/50 bg-slate-900/40'
      }`}
    >
      <div
        className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border ${color}`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.75} />
        {unread && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 ring-2 ring-slate-900" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <p className={`truncate text-sm font-semibold ${unread ? 'text-white' : 'text-slate-300'}`}>
            {notification.title}
          </p>
          <span className={`flex-shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${color}`}>
            {NOTIFICATION_TYPE_LABELS[notification.type]}
          </span>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">{notification.preview}</p>
        <p className="mt-1.5 text-[10px] text-slate-600">
          {formatNotificationTime(notification.createdAt)}
        </p>
      </div>
    </motion.button>
  );
}

export default function NotificationsPage() {
  const { notifications, isRead, markRead, markAllRead, unreadCount } = useNotifications();
  const [selected, setSelected] = useState<Notification | null>(null);

  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleOpen = (notification: Notification) => {
    markRead(notification.id);
    setSelected(notification);
  };

  const handleClose = () => setSelected(null);

  return (
    <PageContainer>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            {unreadCount > 0
              ? `${unreadCount} ta o'qilmagan habar`
              : 'Barcha habarlar o\'qilgan'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700/60"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Barchasini o&apos;qilgan
          </button>
        )}
      </div>

      <div className="space-y-2">
        {sorted.map((notification, index) => (
          <NotificationRow
            key={notification.id}
            notification={notification}
            unread={!isRead(notification.id)}
            onClick={() => handleOpen(notification)}
            index={index}
          />
        ))}
      </div>

      <NotificationModal notification={selected} onClose={handleClose} />
    </PageContainer>
  );
}
