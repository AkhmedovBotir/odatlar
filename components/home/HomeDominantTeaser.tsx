'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, ChevronRight, Play, Zap } from 'lucide-react';
import type { Dominant } from '@/lib/types';
import { getHabitColor } from '@/lib/habitColors';

interface HomeDominantTeaserProps {
  dominants: Dominant[];
}

export default function HomeDominantTeaser({ dominants }: HomeDominantTeaserProps) {
  if (dominants.length === 0) return null;

  const dominant = dominants[0];
  const color = getHabitColor(dominant.id);

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white md:text-base">Dominant mashqi</h2>
        <Link
          href="/dominantalar"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-violet-400 hover:text-violet-300"
        >
          Barchasi
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-900/70 ${color.border} ${color.gradient}`}
      >
        <div className="p-4">
          <div className="mb-3 flex items-start gap-3">
            <div
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${color.ring}`}
            >
              <Brain className={`h-5 w-5 ${color.accent}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white">{dominant.title}</p>
              <p className="mt-1 flex items-start gap-1 text-xs text-slate-400">
                <Zap className="mt-0.5 h-3 w-3 flex-shrink-0 text-amber-400" />
                <span className="line-clamp-2">{dominant.cue}</span>
              </p>
              <p className="mt-2 text-[10px] text-slate-500">
                {dominant.sessionsCompleted} sessiya bajarilgan
              </p>
            </div>
          </div>

          <Link href={`/dominantalar/${dominant.id}/tur`} className="block">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold shadow-md shadow-violet-900/20">
              <Play className="h-4 w-4 fill-current" />
              Mashq boshlash
            </span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
