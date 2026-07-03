'use client';

import { motion } from 'framer-motion';
import { Check, Edit2, Flame, Trash2 } from 'lucide-react';
import type { GoodHabit } from '@/lib/types';
import { getHabitColor } from '@/lib/habitColors';

interface PracticeCardProps {
  habit: GoodHabit;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PracticeCard({ habit, onToggle, onEdit, onDelete }: PracticeCardProps) {
  const color = getHabitColor(habit.id);
  const done = habit.completedToday;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 transition-all ${
        done
          ? 'border-emerald-500/30 from-emerald-950/30 to-slate-900/60'
          : `${color.border} ${color.gradient} hover:border-slate-500/50`
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label={done ? 'Bekor qilish' : 'Bajarildi'}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all active:scale-95 ${
            done
              ? 'border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-900/40'
              : `border-slate-500/60 bg-slate-900/50 hover:border-emerald-400/60 hover:bg-slate-800`
          }`}
        >
          {done && <Check className="h-5 w-5 stroke-[3]" />}
        </button>

        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-sm font-semibold md:text-base ${
              done ? 'text-slate-400 line-through' : 'text-white'
            }`}
          >
            {habit.name}
          </p>
          {habit.streak > 0 && (
            <p className={`mt-0.5 flex items-center gap-1 text-xs ${color.accent}`}>
              <Flame className="h-3 w-3" />
              {habit.streak} kun streyk
            </p>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/80 hover:text-blue-400"
            aria-label="Tahrirlash"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800/80 hover:text-red-400"
            aria-label="O'chirish"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
