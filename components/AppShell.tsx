'use client';

import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import SideNav from '@/components/SideNav';
import RewardFloating from '@/components/RewardFloating';
import { useUserData } from '@/components/UserDataProvider';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { loading, error, rewards, retryLoad } = useUserData();
  const pathname = usePathname();

  if (loading) {
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
    pathname.startsWith('/dominantalar/') && pathname !== '/dominantalar';

  return (
    <div className="w-full h-dvh min-h-dvh bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex">
      <SideNav />

      <div className="flex flex-col flex-1 min-w-0">
        <TopNav showBack={isSubPage} />

        <div className="flex-1 overflow-y-auto">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </div>

        <BottomNav />
      </div>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {rewards.map((reward) => (
          <RewardFloating key={reward.id} amount={reward.amount} type={reward.type} />
        ))}
      </div>
    </div>
  );
}
