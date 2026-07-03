'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';
import { formatUzbekDate } from '@/lib/datetime';
import type { Dominant } from '@/lib/types';

interface DominantHeroProps {
  dominants: Dominant[];
  totalSessions: number;
}

export default function DominantHero({ dominants, totalSessions }: DominantHeroProps) {
  const todayLabel = formatUzbekDate(new Date(), { weekday: 'long' });
  const avgSessions =
    dominants.length > 0 ? Math.round((totalSessions / dominants.length) * 10) / 10 : 0;
  const topDominant = [...dominants].sort(
    (a, b) => (b.sessionsCompleted || 0) - (a.sessionsCompleted || 0)
  )[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-violet-950/50 via-slate-900/80 to-slate-900 shadow-lg shadow-black/20"
    >
      <div className="p-4 md:p-5">
        <div className="mb-4 flex items-center gap-4">
          <div className="relative flex h-[76px] w-[76px] flex-shrink-0 items-center justify-center rounded-full border-[6px] border-violet-800/80 bg-violet-950/40">
            <Brain className="h-8 w-8 text-violet-400" strokeWidth={1.75} />
            {totalSessions > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
                {totalSessions}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Dominant tracker
            </p>
            <p className="truncate text-base font-bold capitalize text-white md:text-lg">
              {todayLabel}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              <span className="font-bold text-violet-400">{dominants.length}</span>
              <span className="text-slate-500"> ta dominanta · </span>
              <span className="font-bold text-violet-400">{totalSessions}</span>
              <span className="text-slate-500"> sessiya</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-3">
          <div className="rounded-xl border border-violet-900/40 bg-violet-950/30 px-2 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-500/80">
              Jami
            </p>
            <p className="text-sm font-bold tabular-nums text-violet-300">{dominants.length}</p>
          </div>
          <div className="rounded-xl border border-violet-900/40 bg-violet-950/30 px-2 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-500/80">
              Sessiyalar
            </p>
            <p className="text-sm font-bold tabular-nums text-violet-300">{totalSessions}</p>
          </div>
          <div className="rounded-xl border border-violet-900/40 bg-violet-950/30 px-2 py-2 text-center">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-500/80">
              O&apos;rtacha
            </p>
            <p className="text-sm font-bold tabular-nums text-violet-300">{avgSessions}</p>
          </div>
        </div>

        {topDominant && topDominant.sessionsCompleted > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-violet-800/30 bg-violet-950/20 px-3 py-2">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-violet-400" />
            <p className="truncate text-xs text-slate-400">
              Eng faol:{' '}
              <span className="font-semibold text-violet-300">{topDominant.title}</span>
              <span className="text-slate-500"> · {topDominant.sessionsCompleted} sessiya</span>
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
