'use client';

import { motion } from 'framer-motion';
import type { ActivityBar } from '@/lib/activityStats';
import { getActivitySummary } from '@/lib/activityStats';

interface ActivityChartProps {
  title: string;
  subtitle: string;
  bars: ActivityBar[];
  emptyLabel?: string;
  accent?: 'blue' | 'emerald' | 'cyan' | 'violet';
}

const CHART_HEIGHT = 128;

const accentStyles = {
  blue: {
    bar: 'from-blue-600 to-cyan-400 shadow-blue-900/30',
    value: 'text-blue-300',
    summary: 'text-blue-300',
  },
  emerald: {
    bar: 'from-emerald-600 to-emerald-400 shadow-emerald-900/30',
    value: 'text-emerald-300',
    summary: 'text-emerald-300',
  },
  cyan: {
    bar: 'from-cyan-600 to-cyan-400 shadow-cyan-900/30',
    value: 'text-cyan-300',
    summary: 'text-cyan-300',
  },
  violet: {
    bar: 'from-violet-600 to-purple-400 shadow-violet-900/30',
    value: 'text-violet-300',
    summary: 'text-violet-300',
  },
};

export default function ActivityChart({
  title,
  subtitle,
  bars,
  emptyLabel = "Hali faoliyat yo'q",
  accent = 'blue',
}: ActivityChartProps) {
  const { total, max, average } = getActivitySummary(bars);
  const hasData = total > 0;
  const styles = accentStyles[accent];

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div>
            <p className="text-slate-500">Jami</p>
            <p className={`font-bold tabular-nums ${styles.summary}`}>{total}</p>
          </div>
          <div>
            <p className="text-slate-500">O&apos;rtacha</p>
            <p className="font-bold text-purple-300 tabular-nums">{average}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-700 text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="flex gap-1.5 sm:gap-2" style={{ height: CHART_HEIGHT + 52 }}>
          {bars.map((bar, index) => {
            const barHeight =
              max > 0
                ? Math.max(Math.round((bar.value / max) * CHART_HEIGHT), bar.value > 0 ? 6 : 0)
                : 0;

            return (
              <div
                key={`${bar.label}-${bar.hint ?? index}`}
                className="flex min-w-0 flex-1 flex-col items-center"
                style={{ height: CHART_HEIGHT + 52 }}
              >
                <span
                  className={`mb-1 h-4 text-[10px] font-semibold tabular-nums ${styles.value}`}
                >
                  {bar.value > 0 ? bar.value : ''}
                </span>

                <div
                  className="flex w-full flex-1 items-end justify-center"
                  style={{ minHeight: CHART_HEIGHT }}
                >
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: barHeight }}
                    transition={{ duration: 0.45, delay: index * 0.04, ease: 'easeOut' }}
                    className={`w-full max-w-10 min-w-[0.35rem] rounded-t-md bg-gradient-to-t shadow-sm ${styles.bar}`}
                    title={bar.hint ? `${bar.hint}: ${bar.value}` : String(bar.value)}
                  />
                </div>

                <span
                  className="mt-2 w-full truncate text-center text-[9px] leading-tight text-slate-400 sm:text-[10px]"
                  title={bar.label}
                >
                  {bar.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
