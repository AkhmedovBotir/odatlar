'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Flame } from 'lucide-react';
import type { GoodHabit } from '@/lib/types';
import { getHabitColor } from '@/lib/habitColors';

interface HomeTodayListProps {
  practices: GoodHabit[];
  onToggle: (habit: GoodHabit) => void;
}

export default function HomeTodayList({ practices, onToggle }: HomeTodayListProps) {
  if (practices.length === 0) {
    return (
      <div className="mb-5 rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 px-4 py-8 text-center">
        <p className="text-sm text-slate-400">Hali amaliyotlar yoʻq</p>
        <Link
          href="/odatlar"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-400 hover:text-blue-300"
        >
          Odat qoʻshish
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <section className="mb-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-white md:text-base">Bugungi amaliyotlar</h2>
        <Link
          href="/odatlar"
          className="inline-flex items-center gap-0.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          Barchasi
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="space-y-2">
        {practices.slice(0, 5).map((habit, index) => {
          const color = getHabitColor(habit.id);
          const done = habit.completedToday;

          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.04 }}
              className={`flex items-center gap-3 rounded-2xl border bg-gradient-to-br px-3 py-3 ${
                done
                  ? 'border-emerald-800/40 from-emerald-950/25 to-slate-900/60'
                  : `${color.border} ${color.gradient}`
              }`}
            >
              <button
                type="button"
                onClick={() => onToggle(habit)}
                aria-label={done ? 'Bekor qilish' : 'Bajarildi'}
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
                  done
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-600 bg-slate-900/50 hover:border-emerald-500/50'
                }`}
              >
                {done && <Check className="h-4 w-4 stroke-[3]" />}
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold ${
                    done ? 'text-slate-500 line-through' : 'text-white'
                  }`}
                >
                  {habit.name}
                </p>
                {habit.streak > 0 && (
                  <p className={`mt-0.5 flex items-center gap-1 text-[10px] ${color.accent}`}>
                    <Flame className="h-3 w-3" />
                    {habit.streak} kun
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
