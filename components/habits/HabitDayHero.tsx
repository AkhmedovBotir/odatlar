'use client';

import { motion } from 'framer-motion';
import { formatUzbekDate } from '@/lib/datetime';
import { getLocalDateKey } from '@/lib/habits';
import type { GoodHabit, HabitHistoryEntry } from '@/lib/types';
import { getPractices, getIndicators } from '@/lib/indicators';
import { getCompletionHeatClass, getDayCompletionRate } from '@/lib/completionHeat';

interface HabitDayHeroProps {
  variant: 'practice' | 'indicator';
  completed: number;
  total: number;
  habits: GoodHabit[];
  history?: HabitHistoryEntry[];
}

function CircularProgress({ percent, size = 76 }: { percent: number; size?: number }) {
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-700/80"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#habitRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="habitRing" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold leading-none tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

function WeekStrip({
  variant,
  habits,
  history,
}: {
  variant: 'practice' | 'indicator';
  habits: GoodHabit[];
  history: HabitHistoryEntry[];
}) {
  const tracked =
    variant === 'practice' ? getPractices(habits) : getIndicators(habits);
  const trackedIds = new Set(tracked.map((h) => h.id));
  const days: { dateKey: string; label: string; rate: number; isToday: boolean }[] = [];
  const today = new Date();
  const todayKey = getLocalDateKey(today);
  const weekdayLabels = ['Y', 'D', 'Se', 'C', 'P', 'J', 'Sh'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateKey(d);
    const label = dateKey === todayKey ? 'B' : weekdayLabels[d.getDay()];

    if (tracked.length === 0) {
      days.push({ dateKey, label, rate: 0, isToday: dateKey === todayKey });
      continue;
    }

    const dayEntries = history.filter(
      (entry) =>
        entry.date === dateKey &&
        trackedIds.has(entry.habitId) &&
        (entry.kind ?? 'practice') === variant
    );

    const logged =
      variant === 'practice'
        ? dayEntries.filter((e) => !e.isEmpty && e.valueId !== 'skip').length
        : dayEntries.length;

    const rate = getDayCompletionRate(logged, tracked.length);
    days.push({ dateKey, label, rate, isToday: dateKey === todayKey });
  }

  return (
    <div className="flex items-end justify-between gap-1.5 pt-1">
      {days.map((day) => (
        <div key={day.dateKey} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`h-9 w-full max-w-[1.85rem] rounded-lg transition-colors ${getCompletionHeatClass(
              day.rate,
              variant
            )} ${day.isToday ? 'ring-2 ring-white/25 ring-offset-1 ring-offset-slate-900' : ''}`}
            title={`${day.rate}%`}
          />
          <span
            className={`text-[9px] font-semibold ${
              day.isToday
                ? variant === 'indicator'
                  ? 'text-cyan-400'
                  : 'text-emerald-400'
                : 'text-slate-500'
            }`}
          >
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HabitDayHero({
  variant,
  completed,
  total,
  habits,
  history = [],
}: HabitDayHeroProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const todayLabel = formatUzbekDate(new Date(), { weekday: 'long' });
  const isPractice = variant === 'practice';
  const tracked = isPractice ? getPractices(habits) : getIndicators(habits);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/90 via-slate-900/80 to-slate-900 shadow-lg shadow-black/20"
    >
      <div className="p-4 md:p-5">
        <div className="mb-4 flex items-center gap-4">
          {isPractice ? (
            <CircularProgress percent={percent} />
          ) : (
            <div className="relative flex h-[76px] w-[76px] flex-shrink-0 flex-col items-center justify-center rounded-full border-[6px] border-slate-700/80 bg-slate-800/60">
              <span className="text-lg font-bold leading-none tabular-nums text-cyan-400">
                {percent}%
              </span>
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Bugun
            </p>
            <p className="truncate text-base font-bold capitalize text-white md:text-lg">
              {todayLabel}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              <span className={`font-bold ${isPractice ? 'text-emerald-400' : 'text-cyan-400'}`}>
                {completed}
              </span>
              <span className="text-slate-500"> / {total}</span>{' '}
              {isPractice ? 'bajarildi' : 'kiritildi'}
            </p>
          </div>
        </div>

        {tracked.length > 0 && (
          <div className="border-t border-slate-700/50 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Haftalik ko&apos;rinish
            </p>
            <WeekStrip variant={variant} habits={habits} history={history} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
