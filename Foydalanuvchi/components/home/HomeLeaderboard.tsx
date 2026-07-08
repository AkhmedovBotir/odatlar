'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Medal } from 'lucide-react';
import type { LeaderboardEntry } from '@/lib/types';

interface HomeLeaderboardProps {
  entries: LeaderboardEntry[];
  userName: string;
}

export default function HomeLeaderboard({ entries, userName }: HomeLeaderboardProps) {
  const top = entries.slice(0, 5);
  if (top.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white md:text-base">Klub reytingi</h2>
        <Link
          href="/statistika?tab=reyting"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          Toʻliq
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60">
        {top.map((entry, index) => {
          const isUser = entry.isMe || entry.name === userName;
          const medalColor =
            entry.rank === 1
              ? 'text-amber-400'
              : entry.rank === 2
                ? 'text-slate-300'
                : entry.rank === 3
                  ? 'text-orange-400'
                  : 'text-slate-600';

          return (
            <motion.div
              key={entry.name}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.04 }}
              className={`flex items-center gap-3 border-b border-slate-700/40 px-4 py-3 last:border-b-0 ${
                isUser ? 'bg-blue-950/25' : ''
              }`}
            >
              <div className="flex w-8 flex-shrink-0 items-center justify-center">
                {entry.rank <= 3 ? (
                  <Medal className={`h-5 w-5 ${medalColor}`} />
                ) : (
                  <span className="text-sm font-bold tabular-nums text-slate-500">
                    {entry.rank}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    isUser ? 'text-blue-300' : 'text-white'
                  }`}
                >
                  {entry.name}
                  {isUser && (
                    <span className="ml-1.5 text-[10px] font-normal text-blue-400/80">(siz)</span>
                  )}
                </p>
                <p className="text-[10px] text-slate-500">{entry.level}-daraja</p>
              </div>

              <p className="flex-shrink-0 text-sm font-bold tabular-nums text-slate-300">
                {entry.xp} XP
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
