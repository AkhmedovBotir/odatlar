'use client';

import { PERIOD_OPTIONS, type HistoryPeriod } from '@/lib/habits';

interface PeriodFilterProps {
  value: HistoryPeriod;
  onChange: (period: HistoryPeriod) => void;
}

export default function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-5">
      {PERIOD_OPTIONS.map((option) => {
        const isActive = value === option.id;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all border ${
              isActive
                ? 'bg-blue-600/80 border-blue-500 text-white'
                : 'bg-slate-800/60 border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
