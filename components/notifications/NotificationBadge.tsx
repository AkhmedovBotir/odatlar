'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNotifications } from '@/components/NotificationProvider';

interface NotificationBadgeProps {
  className?: string;
}

export default function NotificationBadge({ className }: NotificationBadgeProps) {
  const { unreadCount } = useNotifications();

  return (
    <Link
      href="/habarlar"
      aria-label={`Bildirishnomalar${unreadCount > 0 ? `, ${unreadCount} ta o'qilmagan` : ''}`}
      className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-slate-800/80 transition-colors hover:bg-slate-700/80 ${className ?? ''}`}
    >
      <Bell className="h-[1.1rem] w-[1.1rem] text-slate-300" strokeWidth={1.75} />
      {unreadCount > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-1 -top-1 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-md shadow-red-900/50"
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </motion.span>
      )}
    </Link>
  );
}
