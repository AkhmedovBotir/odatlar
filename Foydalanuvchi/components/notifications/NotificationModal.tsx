'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { OverlayPortal } from '@/components/OverlayPortal';
import {
  Award,
  Bell,
  Brain,
  Gift,
  Settings,
  TrendingUp,
  Trophy,
  X,
} from 'lucide-react';
import {
  NOTIFICATION_TYPE_LABELS,
  formatNotificationTime,
  type Notification,
  type NotificationType,
} from '@/lib/notifications';

const typeStyles: Record<
  NotificationType,
  { icon: typeof Bell; accent: string; border: string; bg: string }
> = {
  mukofot: {
    icon: Gift,
    accent: 'text-amber-400',
    border: 'border-amber-800/40',
    bg: 'bg-amber-950/30',
  },
  reyting: {
    icon: TrendingUp,
    accent: 'text-blue-400',
    border: 'border-blue-800/40',
    bg: 'bg-blue-950/30',
  },
  eslatma: {
    icon: Bell,
    accent: 'text-orange-400',
    border: 'border-orange-800/40',
    bg: 'bg-orange-950/30',
  },
  tizim: {
    icon: Settings,
    accent: 'text-slate-300',
    border: 'border-slate-600/40',
    bg: 'bg-slate-800/50',
  },
  yutuq: {
    icon: Trophy,
    accent: 'text-emerald-400',
    border: 'border-emerald-800/40',
    bg: 'bg-emerald-950/30',
  },
  mashq: {
    icon: Brain,
    accent: 'text-violet-400',
    border: 'border-violet-800/40',
    bg: 'bg-violet-950/30',
  },
};

function ModalBody({ notification }: { notification: Notification }) {
  switch (notification.type) {
    case 'mukofot':
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">{notification.reason}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase text-amber-500/80">XP</p>
              <p className="text-lg font-bold text-amber-300">+{notification.xp}</p>
            </div>
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 px-3 py-2.5 text-center">
              <p className="text-[10px] uppercase text-amber-500/80">Tanga</p>
              <p className="text-lg font-bold text-amber-300">+{notification.coins}</p>
            </div>
          </div>
        </div>
      );

    case 'reyting':
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4 rounded-xl border border-blue-800/40 bg-blue-950/20 px-4 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-slate-500 line-through">
                #{notification.oldRank}
              </p>
              <p className="text-[10px] text-slate-500">Oldin</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-400" />
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-300">#{notification.newRank}</p>
              <p className="text-[10px] text-blue-400/80">Hozir</p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {notification.totalUsers} kishi orasida {notification.delta} pogʻona koʻtarildingiz
          </p>
        </div>
      );

    case 'eslatma':
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-orange-800/40 bg-orange-950/20 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase text-orange-500/80">Odat</p>
            <p className="font-semibold text-white">{notification.habitName}</p>
            <p className="mt-1 text-sm text-orange-300">Soat {notification.scheduledTime}</p>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{notification.message}</p>
        </div>
      );

    case 'yutuq':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-4 py-3">
            <Award className="h-10 w-10 text-emerald-400" />
            <div>
              <p className="font-bold text-emerald-300">{notification.badgeLabel}</p>
              <p className="text-sm text-slate-400">{notification.habitName}</p>
            </div>
          </div>
          <p className="text-center text-3xl font-bold text-emerald-400">{notification.streak} kun</p>
          <p className="text-sm leading-relaxed text-slate-300">{notification.message}</p>
        </div>
      );

    case 'mashq':
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-violet-800/40 bg-violet-950/20 px-4 py-3">
            <p className="font-semibold text-white">{notification.dominantTitle}</p>
            <p className="mt-1 text-xs text-slate-400">
              ⚡ {notification.cue}
            </p>
          </div>
          <p className="text-sm text-slate-300">{notification.tip}</p>
          <p className="text-xs text-slate-500">
            {notification.sessionsCompleted} ta sessiya bajarilgan
          </p>
          <Link
            href="/dominantalar"
            className="block rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-center text-sm font-semibold"
          >
            Mashqni boshlash
          </Link>
        </div>
      );

    case 'tizim':
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">Versiya {notification.version}</p>
          <ul className="space-y-2">
            {notification.features.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2 text-sm text-slate-300"
              >
                <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-slate-500" />
                {feature}
              </li>
            ))}
          </ul>
          {notification.actionHref && notification.actionLabel && (
            <Link
              href={notification.actionHref}
              className="block rounded-xl border border-slate-600 bg-slate-800 py-2.5 text-center text-sm font-semibold text-blue-300 hover:bg-slate-700"
            >
              {notification.actionLabel}
            </Link>
          )}
        </div>
      );

    default:
      return null;
  }
}

interface NotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
}

export default function NotificationModal({ notification, onClose }: NotificationModalProps) {
  if (!notification) return null;

  const style = typeStyles[notification.type];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      {notification && (
        <OverlayPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[min(90vh,calc(100dvh-env(safe-area-inset-top,0px)-1rem))] w-full max-w-md overflow-y-auto rounded-t-2xl border border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:rounded-2xl"
            >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border ${style.border} ${style.bg}`}
                >
                  <Icon className={`h-5 w-5 ${style.accent}`} />
                </div>
                <div>
                  <span
                    className={`mb-1 inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${style.border} ${style.bg} ${style.accent}`}
                  >
                    {NOTIFICATION_TYPE_LABELS[notification.type]}
                  </span>
                  <h2 className="text-lg font-bold text-white">{notification.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatNotificationTime(notification.createdAt)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700 hover:text-slate-200"
                aria-label="Yopish"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <ModalBody notification={notification} />

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-xl bg-slate-700 py-2.5 text-sm font-semibold hover:bg-slate-600"
            >
              Yopish
            </button>
          </motion.div>
        </motion.div>
        </OverlayPortal>
      )}
    </AnimatePresence>
  );
}
