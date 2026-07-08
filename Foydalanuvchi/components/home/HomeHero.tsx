'use client';

import { motion } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';
import type { UserData } from '@/lib/types';
import { formatUzbekDate } from '@/lib/datetime';
import { getUserRank } from '@/lib/gamification';
import { getPractices } from '@/lib/indicators';
import { getCompletionHeatClass, getDayCompletionRate } from '@/lib/completionHeat';
import { getLocalDateKey } from '@/lib/habits';
import type { HabitHistoryEntry } from '@/lib/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Xayrli tong';
  if (hour < 17) return 'Xayrli kunduzi';
  return 'Xayrli oqshom';
}

function CircularProgress({ percent, size = 80 }: { percent: number; size?: number }) {
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
          strokeWidth={stroke}
          className="text-slate-700/80"
          stroke="currentColor"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#homeRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <defs>
          <linearGradient id="homeRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold tabular-nums leading-none">{percent}%</span>
        <span className="mt-0.5 text-[9px] text-slate-500">bugun</span>
      </div>
    </div>
  );
}

function WeekMiniStrip({
  practices,
  history,
}: {
  practices: ReturnType<typeof getPractices>;
  history: HabitHistoryEntry[];
}) {
  const practiceIds = new Set(practices.map((p) => p.id));
  const todayKey = getLocalDateKey(new Date());
  const labels = ['Y', 'D', 'Se', 'C', 'P', 'J', 'Sh'];

  const days: { label: string; rate: number; isToday: boolean }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateKey(d);
    const dayEntries = history.filter(
      (e) => e.date === dateKey && practiceIds.has(e.habitId)
    );
    const completed = new Set(dayEntries.map((e) => e.habitId)).size;
    days.push({
      label: labels[d.getDay()],
      rate: getDayCompletionRate(completed, practices.length),
      isToday: dateKey === todayKey,
    });
  }

  return (
    <div className="flex justify-between gap-1">
      {days.map((day) => (
        <div key={day.label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={`h-7 w-full max-w-[2rem] rounded-md transition-colors ${getCompletionHeatClass(day.rate)} ${
              day.isToday ? 'ring-1 ring-blue-400/60 ring-offset-1 ring-offset-slate-900' : ''
            }`}
            title={`${day.rate}%`}
          />
          <span
            className={`text-[9px] font-medium ${day.isToday ? 'text-blue-300' : 'text-slate-600'}`}
          >
            {day.label}
          </span>
        </div>
      ))}
    </div>
  );
}

interface HomeHeroProps {
  userData: UserData;
  completedToday: number;
  totalPractices: number;
}

export default function HomeHero({ userData, completedToday, totalPractices }: HomeHeroProps) {
  const percent = getDayCompletionRate(completedToday, totalPractices);
  const rank = getUserRank(userData);
  const xpPercent = Math.min(100, (userData.xp / userData.nextLevelXp) * 100);
  const practices = getPractices(userData.goodHabits);
  const history = userData.habitHistory ?? [];
  const todayLabel = formatUzbekDate(new Date(), { weekday: 'long' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-blue-950/40 via-slate-900/80 to-slate-900 shadow-lg shadow-black/20"
    >
      <div className="p-4 md:p-5">
        <div className="mb-4 flex items-start gap-4">
          <CircularProgress percent={percent} />

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {todayLabel}
            </p>
            <h1 className="truncate text-xl font-bold text-white md:text-2xl">
              {getGreeting()}, {userData.name}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              <span className="font-semibold text-blue-300">{completedToday}</span>
              <span className="text-slate-500"> / {totalPractices} amaliyot bugun</span>
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-blue-900/40 bg-blue-950/30 px-2 py-1 text-xs font-semibold text-blue-300">
                <Trophy className="h-3 w-3" />
                #{rank ?? '—'}
              </span>
              <span className="rounded-lg border border-violet-900/40 bg-violet-950/30 px-2 py-1 text-xs font-semibold text-violet-300">
                {userData.level}-daraja
              </span>
              {userData.coins > 0 && (
                <span className="rounded-lg border border-amber-900/40 bg-amber-950/30 px-2 py-1 text-xs font-semibold text-amber-300">
                  {userData.coins} tanga
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-500">
            <span>XP progress</span>
            <span className="tabular-nums">
              {userData.xp} / {userData.nextLevelXp}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
            />
          </div>
        </div>

        {practices.length > 0 && (
          <div className="border-t border-slate-700/50 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Haftalik ko&apos;rinish
            </p>
            <WeekMiniStrip practices={practices} history={history} />
          </div>
        )}

        {percent === 100 && totalPractices > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-3 py-2">
            <Sparkles className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <p className="text-xs text-emerald-300">Bugungi barcha amaliyotlar bajarildi!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
