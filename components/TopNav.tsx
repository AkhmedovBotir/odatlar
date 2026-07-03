'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock3 } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import { formatUzbekDate, formatUzbekDateTime, formatUzbekTime } from '@/lib/datetime';

interface TopNavProps {
  showBack?: boolean;
}

const titles: Record<string, string> = {
  '/': 'Bosh sahifa',
  '/statistika': 'Statistika',
  '/odatlar': 'Odatlar',
  '/dominantalar': 'Dominantalar',
  '/dominantalar/yangi': 'Yangi dominanta',
};

function getTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  if (pathname.includes('/sessiya')) return 'Mashq sessiyasi';
  if (pathname.includes('/tur')) return 'Mashq usuli';
  if (pathname.match(/^\/dominantalar\/[^/]+$/)) return 'Dominanta mashqi';
  return 'Odatlar Klub';
}

export default function TopNav({ showBack = false }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showHabitModal, setShowHabitModal } = useUserData();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBack = () => {
    if (showHabitModal) {
      setShowHabitModal(false);
      return;
    }

    if (pathname.includes('/sessiya')) {
      router.push(pathname.replace('/sessiya', '/tur'));
      return;
    }
    if (pathname.includes('/tur')) {
      if (pathname.includes('/yangi')) {
        router.push('/dominantalar/yangi');
      } else {
        const id = pathname.split('/')[2];
        router.push(`/dominantalar/${id}`);
      }
      return;
    }
    if (pathname === '/dominantalar/yangi') {
      router.push('/dominantalar');
      return;
    }
    if (pathname.match(/^\/dominantalar\/[^/]+$/)) {
      router.push('/dominantalar');
      return;
    }
    router.back();
  };

  const showBackButton = showBack || showHabitModal;
  const title = getTitle(pathname);

  const mobileDate = formatUzbekDate(now, { weekday: false });
  const mobileTime = formatUzbekTime(now, false);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="safe-top flex-shrink-0 px-3 sm:px-4 lg:px-8 pt-2 pb-2.5 lg:pt-3 lg:pb-3"
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile / tablet */}
        <div className="lg:hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-lg shadow-sm shadow-black/20 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-h-[2.5rem]">
            {showBackButton && (
              <motion.button
                onClick={handleBack}
                whileTap={{ scale: 0.95 }}
                className="p-2 -ml-1 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                aria-label="Orqaga"
              >
                <ArrowLeft className="w-5 h-5 text-blue-400" />
              </motion.button>
            )}

            <h1 className="flex-1 min-w-0 text-base sm:text-lg font-bold truncate leading-tight">
              {title}
            </h1>

            <div className="flex items-center gap-1.5 flex-shrink-0 rounded-xl bg-slate-800/80 border border-slate-700/60 px-2.5 py-1.5">
              <Clock3 className="w-3.5 h-3.5 text-blue-400/80 hidden min-[360px]:block" />
              <div className="text-right leading-tight">
                <p className="text-[10px] sm:text-[11px] text-slate-400 tabular-nums whitespace-nowrap">
                  {mobileDate}
                </p>
                <p className="text-xs sm:text-sm font-semibold text-blue-200 tabular-nums whitespace-nowrap">
                  {mobileTime}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-between gap-4 border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            {showBackButton && (
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                aria-label="Orqaga"
              >
                <ArrowLeft className="w-5 h-5 text-blue-400" />
              </motion.button>
            )}
            <h1 className="text-2xl xl:text-3xl font-bold truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-2">
            <Clock3 className="w-4 h-4 text-blue-400/80 flex-shrink-0" />
            <p className="text-sm text-slate-300 tabular-nums whitespace-nowrap">
              {formatUzbekDateTime(now, { weekday: 'long', withSeconds: true })}
            </p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
