'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import RewardFloating from '@/components/RewardFloating';
import NavigationLoader from '@/components/NavigationLoader';
import { useUserData } from '@/components/UserDataProvider';
import { useTelegramWebApp } from '@/components/TelegramWebAppProvider';
import { runtimeConfig } from '@/lib/runtimeConfig';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, error, rewards, retryLoad } = useUserData();
  const { loading: tgLoading, telegramUser } = useTelegramWebApp();
  const pathname = usePathname();

  if (tgLoading || loading) {
    return (
      <div className="w-full h-dvh min-h-dvh flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!telegramUser) {
    const botUrl = runtimeConfig.botUsername
      ? `https://t.me/${runtimeConfig.botUsername.replace(/^@/, '')}`
      : null;

    return (
      <div className="w-full h-dvh min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 ring-1 ring-blue-500/40">
          <Bot className="h-8 w-8 text-blue-400" />
        </div>
        <h1 className="mb-2 text-xl font-bold text-white">Kirish cheklangan</h1>
        <p className="max-w-xs text-sm text-slate-400">
          Bu ilova faqat Telegram bot orqali ochilishi mumkin. Iltimos, ilovani bot orqali qayta
          oching.
        </p>
        {botUrl && (
          <a
            href={botUrl}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:from-blue-500 hover:to-violet-500"
          >
            <Bot className="h-4 w-4" />
            Botni ochish
          </a>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-dvh min-h-dvh flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={retryLoad}
          className="bg-blue-600 hover:bg-blue-500 rounded-lg px-6 py-2.5 font-semibold transition-all"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const isSubPage =
    (pathname.startsWith('/dominantalar/') && pathname !== '/dominantalar') ||
    pathname.startsWith('/qollanma/dars/') ||
    pathname.startsWith('/qollanma/kurs/') ||
    pathname.startsWith('/qollanma/video/');

  return (
    <div className="w-full h-dvh min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex">
      <SideNav />

      <div className="flex flex-col flex-1 min-w-0">
        <TopNav showBack={isSubPage} />

        <div className="relative flex-1 overflow-y-auto overscroll-contain">
          <NavigationLoader />
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>
      </div>

      <BottomNav />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {rewards.map((reward) => (
          <RewardFloating key={reward.id} amount={reward.amount} type={reward.type} />
        ))}
      </div>
    </div>
  );
}
