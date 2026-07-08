'use client';

import { Calendar, CalendarRange } from 'lucide-react';
import {
  daysAgoKey,
  getDefaultArchiveDateFilter,
  normalizeArchiveDateFilter,
  todayKey,
  type ArchiveDateFilter,
} from '@/lib/habits';

interface PeriodFilterProps {
  value: ArchiveDateFilter;
  onChange: (filter: ArchiveDateFilter) => void;
  embedded?: boolean;
}

const inputClassName =
  'bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 min-w-0 [color-scheme:dark]';

export default function PeriodFilter({ value, onChange, embedded = false }: PeriodFilterProps) {
  const today = todayKey();
  const filter = normalizeArchiveDateFilter(value);

  const setMode = (mode: ArchiveDateFilter['mode']) => {
    if (mode === filter.mode) return;

    if (mode === 'day') {
      onChange({ mode: 'day', date: today });
      return;
    }

    onChange(getDefaultArchiveDateFilter());
  };

  const setDay = (date: string) => {
    onChange(normalizeArchiveDateFilter({ mode: 'day', date }));
  };

  const setRange = (from: string, to: string) => {
    onChange(normalizeArchiveDateFilter({ mode: 'range', from, to }));
  };

  return (
    <div className={embedded ? 'space-y-3' : 'mb-5 space-y-3'}>
      <div
        className={
          embedded
            ? 'flex flex-col gap-3'
            : 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
        }
      >
        <div
          className={`flex gap-1 rounded-lg border border-slate-700 bg-slate-800/60 p-1 ${
            embedded ? 'w-full' : 'w-full sm:w-auto'
          }`}
        >
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs md:text-sm font-semibold transition-all ${
              filter.mode === 'day'
                ? 'bg-blue-600/80 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Bir kun
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs md:text-sm font-semibold transition-all ${
              filter.mode === 'range'
                ? 'bg-blue-600/80 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Oraliq
          </button>
        </div>

        {filter.mode === 'day' ? (
          <input
            type="date"
            value={filter.date}
            max={today}
            onChange={(e) => e.target.value && setDay(e.target.value)}
            className={`${inputClassName} w-full sm:w-auto`}
            aria-label="Kunni tanlang"
          />
        ) : (
          <div className={`flex w-full flex-col gap-2 sm:flex-row sm:items-center ${embedded ? '' : 'sm:w-auto'}`}>
            <input
              type="date"
              value={filter.from}
              max={filter.to}
              onChange={(e) => e.target.value && setRange(e.target.value, filter.to)}
              className={`${inputClassName} w-full`}
              aria-label="Boshlanish sanasi"
            />
            <span className="hidden text-sm text-slate-500 sm:inline">—</span>
            <input
              type="date"
              value={filter.to}
              min={filter.from}
              max={today}
              onChange={(e) => e.target.value && setRange(filter.from, e.target.value)}
              className={`${inputClassName} w-full`}
              aria-label="Tugash sanasi"
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setDay(today)}
          className="px-3 py-1 rounded-full text-xs font-semibold border bg-slate-800/60 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
        >
          Bugun
        </button>
        <button
          type="button"
          onClick={() => setDay(daysAgoKey(1))}
          className="px-3 py-1 rounded-full text-xs font-semibold border bg-slate-800/60 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
        >
          Kecha
        </button>
        <button
          type="button"
          onClick={() =>
            setRange(daysAgoKey(6), today)
          }
          className="px-3 py-1 rounded-full text-xs font-semibold border bg-slate-800/60 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
        >
          Oxirgi 7 kun
        </button>
        <button
          type="button"
          onClick={() =>
            setRange(daysAgoKey(29), today)
          }
          className="px-3 py-1 rounded-full text-xs font-semibold border bg-slate-800/60 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-all"
        >
          Oxirgi 30 kun
        </button>
      </div>
    </div>
  );
}
