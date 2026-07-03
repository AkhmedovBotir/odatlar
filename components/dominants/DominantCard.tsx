'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Gift, Play, Trash2, Zap } from 'lucide-react';
import type { Dominant } from '@/lib/types';
import { getHabitColor } from '@/lib/habitColors';

interface DominantCardProps {
  dominant: Dominant;
  onDelete: () => void;
}

const typeLabels = {
  fikrlash: 'Fikrlash',
  "ma'lumot": "Ma'lumot",
} as const;

export default function DominantCard({ dominant, onDelete }: DominantCardProps) {
  const color = getHabitColor(dominant.id);
  const sessions = dominant.sessionsCompleted || 0;
  const typeLabel = typeLabels[dominant.type] ?? dominant.type;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-900/70 shadow-sm ${color.border} ${color.gradient}`}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start gap-3">
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${color.ring}`}
          >
            <Brain className={`h-5 w-5 ${color.accent}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug text-white md:text-base">
                {dominant.title}
              </p>
              <button
                onClick={onDelete}
                className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800/80 hover:text-red-400"
                aria-label="O'chirish"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-full border border-violet-500/30 bg-violet-950/40 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                {typeLabel}
              </span>
              <span className="rounded-full border border-slate-600/60 bg-slate-900/50 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                {sessions} sessiya
              </span>
            </div>
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2.5">
          <div className="flex items-start gap-2">
            <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Signal
              </p>
              <p className="text-xs leading-snug text-slate-300">{dominant.cue}</p>
            </div>
          </div>
          <div className="h-px bg-slate-700/50" />
          <div className="flex items-start gap-2">
            <Gift className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pink-400" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Mukofot
              </p>
              <p className="text-xs leading-snug text-slate-300">{dominant.reward}</p>
            </div>
          </div>
        </div>

        {(dominant.pros?.length > 0 || dominant.cons?.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {dominant.pros?.slice(0, 2).map((pro) => (
              <span
                key={pro}
                className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-2 py-1 text-[10px] text-emerald-400"
              >
                + {pro}
              </span>
            ))}
            {dominant.cons?.slice(0, 1).map((con) => (
              <span
                key={con}
                className="rounded-lg border border-red-900/40 bg-red-950/30 px-2 py-1 text-[10px] text-red-400"
              >
                − {con}
              </span>
            ))}
          </div>
        )}

        <Link href={`/dominantalar/${dominant.id}/tur`} className="block">
          <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-indigo-500">
            <Play className="h-4 w-4 fill-current" />
            Mashq boshlash
          </span>
        </Link>
      </div>
    </motion.div>
  );
}
