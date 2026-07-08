'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

export interface HabitTabItem<T extends string> {
  id: T;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}

import { cn } from '@/lib/utils';

interface HabitTabNavProps<T extends string> {
  tabs: HabitTabItem<T>[];
  activeTab: T;
  onChange: (tab: T) => void;
  layoutId?: string;
  action?: ReactNode;
  className?: string;
  constrained?: boolean;
}

export default function HabitTabNav<T extends string>({
  tabs,
  activeTab,
  onChange,
  layoutId = 'habitTab',
  action,
  className,
  constrained = false,
}: HabitTabNavProps<T>) {
  return (
    <div className={cn('mb-5', constrained && 'max-w-lg', className)}>
      <div className="flex min-h-[2.75rem] items-stretch gap-1 rounded-2xl border border-slate-700/60 bg-slate-900/70 p-1 shadow-inner shadow-black/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex min-w-0 flex-1 items-center justify-center gap-1 rounded-xl px-1 py-2 text-[11px] font-semibold transition-colors sm:gap-1.5 sm:px-1.5 sm:text-xs ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-600/90 to-violet-600/80 shadow-md shadow-blue-900/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5 flex-shrink-0 sm:h-4 sm:w-4" />
              <span className="relative z-10 hidden truncate min-[360px]:inline">{tab.label}</span>
              <span className="relative z-10 truncate min-[360px]:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}

        {action && (
          <>
            <div className="my-1.5 w-px flex-shrink-0 bg-slate-700/70" aria-hidden />
            <div className="flex flex-shrink-0 items-stretch">{action}</div>
          </>
        )}
      </div>
    </div>
  );
}
