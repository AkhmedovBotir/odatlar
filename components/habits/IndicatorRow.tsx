'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown, Edit2, Flame, Minus, Plus, Trash2 } from 'lucide-react';
import type { GoodHabit } from '@/lib/types';
import {
  encodeIndicatorValue,
  formatNoteValue,
  getQuickOptionsForNoteUnit,
  getIndicatorStreak,
  getIndicatorStatusTone,
  getNoteUnitForHabit,
  getTodayIndicatorEntry,
  parseIndicatorValue,
  type NoteUnit,
} from '@/lib/indicators';
import { getHabitColor } from '@/lib/habitColors';

interface IndicatorRowProps {
  habit: GoodHabit;
  statusLabel: string;
  history: import('@/lib/types').HabitHistoryEntry[];
  onSave: (value: string, label: string, isEmpty: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const toneStyles = {
  empty: {
    badge: 'bg-slate-800/90 border-slate-600/70 text-slate-300',
    card: 'border-slate-700/60',
  },
  skipped: {
    badge: 'bg-amber-950/50 border-amber-500/40 text-amber-200',
    card: 'border-amber-500/25 from-amber-950/20',
  },
  logged: {
    badge: 'bg-cyan-600/25 border-cyan-400/40 text-cyan-100',
    card: 'border-cyan-500/25 from-cyan-950/20',
  },
};

export default function IndicatorRow({
  habit,
  statusLabel,
  history,
  onSave,
  onEdit,
  onDelete,
}: IndicatorRowProps) {
  const [open, setOpen] = useState(false);
  const [numericInput, setNumericInput] = useState('');
  const [noteUnit, setNoteUnit] = useState<NoteUnit>(() => getNoteUnitForHabit(habit, history));
  const tone = getIndicatorStatusTone(habit, history);
  const styles = toneStyles[tone];
  const streak = getIndicatorStreak(history, habit.id);
  const quickOptions = getQuickOptionsForNoteUnit(noteUnit);
  const color = getHabitColor(habit.id);
  const step = noteUnit === 'soat' ? 0.5 : 5;

  useEffect(() => {
    if (open) {
      setNoteUnit(getNoteUnitForHabit(habit, history));
    }
  }, [open, habit, history]);

  const handleValue = (value: string, isEmpty: boolean) => {
    const encoded = isEmpty ? 'skip' : encodeIndicatorValue(value, noteUnit);
    const label = formatNoteValue(isEmpty ? 'skip' : value, noteUnit, isEmpty);
    onSave(encoded, label, isEmpty);
    setNumericInput('');
    setOpen(false);
  };

  const isSelected = (value: string) => {
    const entry = getTodayIndicatorEntry(history, habit.id);
    if (!entry || entry.isEmpty || entry.valueId === 'skip') return false;
    const parsed = parseIndicatorValue(entry.valueId);
    if (parsed && 'numeric' in parsed) {
      return parsed.unit === noteUnit && String(parsed.numeric) === value;
    }
    return statusLabel === formatNoteValue(value, noteUnit);
  };

  const adjustInput = (delta: number) => {
    const current = Number(numericInput) || 0;
    const next = Math.max(0, Number((current + delta).toFixed(noteUnit === 'soat' ? 1 : 0)));
    setNumericInput(String(next));
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-900/70 shadow-sm ${
        tone === 'empty' ? `${color.border} ${color.gradient}` : styles.card
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${color.ring}`}
          aria-expanded={open}
        >
          <BarChart3 className={`h-5 w-5 ${tone === 'logged' ? 'text-cyan-400' : color.accent}`} />
        </button>

        <button onClick={() => setOpen((prev) => !prev)} className="min-w-0 flex-1 text-left">
          <div className="mb-0.5 flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white md:text-base">{habit.name}</p>
            {streak > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-950/50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400">
                <Flame className="h-3 w-3" />
                {streak}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500">Soat yoki minutda qayd eting</p>
        </button>

        <button
          onClick={() => setOpen((prev) => !prev)}
          className={`flex max-w-[46%] flex-shrink-0 items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-bold sm:text-sm ${styles.badge}`}
        >
          <span className="truncate">{statusLabel}</span>
          <ChevronDown
            className={`h-4 w-4 flex-shrink-0 opacity-70 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        <div className="flex flex-shrink-0 items-center gap-0.5">
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-slate-700/50 px-3 pb-3 pt-2">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 px-2.5 py-2.5">
                <div className="mb-2 flex gap-1">
                  {(['soat', 'minut'] as const).map((unit) => (
                    <button
                      key={unit}
                      type="button"
                      onClick={() => {
                        setNoteUnit(unit);
                        setNumericInput('');
                      }}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                        noteUnit === unit
                          ? 'bg-cyan-600/40 text-cyan-100 ring-1 ring-cyan-400/50'
                          : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {quickOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleValue(option.value, false)}
                      className={`inline-flex min-h-[2.25rem] flex-shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold transition-all ${
                        isSelected(option.value)
                          ? 'border-cyan-400 bg-cyan-600/50 text-white'
                          : 'border-slate-600/70 bg-slate-800/80 text-slate-200 hover:border-cyan-500/50'
                      }`}
                    >
                      <span>{option.label}</span>
                      {option.suffix && (
                        <span className="text-[10px] font-medium text-slate-400">{option.suffix}</span>
                      )}
                    </button>
                  ))}

                  <div className="mx-0.5 h-7 w-px flex-shrink-0 bg-slate-600/80" />

                  <div className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-600/70 bg-slate-800/60 px-1 py-1">
                    <button
                      type="button"
                      onClick={() => adjustInput(-step)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                      aria-label="Kamaytirish"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <div className="flex min-w-[4.5rem] items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step={step}
                        value={numericInput}
                        onChange={(e) => setNumericInput(e.target.value)}
                        placeholder="0"
                        className="w-10 bg-transparent text-center text-base font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <span className="whitespace-nowrap text-[10px] font-semibold text-slate-500">
                        {noteUnit}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustInput(step)}
                      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                      aria-label="Oshirish"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => numericInput.trim() && handleValue(numericInput, false)}
                      className="rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-cyan-500"
                    >
                      OK
                    </button>
                  </div>

                  <div className="mx-0.5 h-7 w-px flex-shrink-0 bg-slate-600/80" />

                  <button
                    onClick={() => handleValue('skip', true)}
                    className={`min-h-[2.25rem] flex-shrink-0 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      tone === 'skipped'
                        ? 'border-amber-500/50 bg-amber-950/60 text-amber-200'
                        : 'border-slate-600/70 bg-slate-800/40 text-slate-400 hover:border-amber-500/40 hover:text-amber-300'
                    }`}
                  >
                    Bajarilmadi
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
