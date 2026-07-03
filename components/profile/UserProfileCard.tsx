'use client';

import { motion } from 'framer-motion';
import type { UserData } from '@/lib/types';
import { getUserRank } from '@/lib/gamification';

interface UserProfileCardProps {
  userData: UserData;
}

export default function UserProfileCard({ userData }: UserProfileCardProps) {
  const progressPercent = (userData.xp / userData.nextLevelXp) * 100;
  const userRank = getUserRank(userData);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-900/35 to-purple-900/35 p-4 md:p-5"
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-600/60 bg-slate-800/80 text-lg">
          👤
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold md:text-xl">{userData.name}</h2>
          <p className="text-xs text-slate-400">
            {userData.level}-daraja · Reyting #{userRank ?? '-'}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-4 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">XP</p>
            <p className="text-lg font-bold tabular-nums text-blue-400">{userData.xp}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-500">Daraja</p>
            <p className="text-lg font-bold tabular-nums text-purple-400">{userData.level}</p>
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
          <span>Keyingi darajaga</span>
          <span className="tabular-nums">
            {userData.xp} / {userData.nextLevelXp}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-700/80">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600"
          />
        </div>
      </div>
    </motion.div>
  );
}
