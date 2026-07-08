import type { GoodHabit, HabitHistoryEntry, IndicatorConfig } from './types';
import { todayKey, getLocalDateKey } from './habits';

export const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {};

export type NoteUnit = 'soat' | 'minut';

export function isPractice(habit: GoodHabit): boolean {
  return habit.kind !== 'indicator';
}

export function isIndicator(habit: GoodHabit): boolean {
  return habit.kind === 'indicator';
}

export function getPractices(habits: GoodHabit[]): GoodHabit[] {
  return habits.filter(isPractice);
}

export function getIndicators(habits: GoodHabit[]): GoodHabit[] {
  return habits.filter(isIndicator);
}

export function encodeIndicatorValue(value: string, unit: NoteUnit): string {
  return `${value}:${unit}`;
}

export function parseIndicatorValue(
  valueId: string | null | undefined
): { numeric: number; unit: NoteUnit } | { skip: true } | null {
  if (!valueId) return null;
  if (valueId === 'skip') return { skip: true };

  const encoded = valueId.match(/^([\d.]+):(soat|minut)$/);
  if (encoded) {
    return { numeric: Number(encoded[1]), unit: encoded[2] as NoteUnit };
  }

  const num = Number(valueId);
  if (!Number.isNaN(num)) {
    return { numeric: num, unit: 'soat' };
  }

  return null;
}

export function noteUnitFromLabel(label: string): NoteUnit | null {
  const lower = label.toLowerCase();
  if (lower.includes('minut') || lower.includes('daq')) return 'minut';
  if (lower.includes('soat')) return 'soat';
  return null;
}

export function formatNoteValue(
  value: string | null | undefined,
  unit: NoteUnit,
  isSkipped = false
): string {
  if (isSkipped || value === 'skip') return 'Bajarilmadi';
  if (!value) return 'Kiritilmagan';

  const num = Number(value);
  if (Number.isNaN(num)) return value;

  return unit === 'soat' ? `${num} soat` : `${num} minut`;
}

/** @deprecated Legacy helper — prefer formatNoteValue with NoteUnit */
export function formatDailyIndicatorValue(
  value: string | null | undefined,
  unit?: string,
  isSkipped = false
): string {
  if (isSkipped || value === 'skip') return 'Bajarilmadi';
  if (!value) return 'Kiritilmagan';

  const parsed = parseIndicatorValue(value);
  if (parsed && 'numeric' in parsed) {
    return formatNoteValue(String(parsed.numeric), parsed.unit);
  }

  const num = Number(value);
  if (Number.isNaN(num)) return value;

  const lower = (unit ?? '').toLowerCase();
  if (lower.includes('minut') || lower.includes('daq')) return `${num} minut`;
  if (lower.includes('soat')) return `${num} soat`;
  if (lower.includes('bet')) return `${num} bet o'qildi`;

  return `${num} ${unit ?? ''}`.trim();
}

export function resolveIndicatorLabel(
  habit: GoodHabit,
  value: string | null | undefined,
  valueLabel?: string
): string {
  if (valueLabel) return valueLabel;
  if (!value || value === 'skip') {
    return value === 'skip' ? 'Bajarilmadi' : 'Kiritilmagan';
  }

  const parsed = parseIndicatorValue(value);
  if (parsed && 'skip' in parsed) return 'Bajarilmadi';
  if (parsed && 'numeric' in parsed) {
    return formatNoteValue(String(parsed.numeric), parsed.unit);
  }

  return formatDailyIndicatorValue(value);
}

export interface QuickOption {
  value: string;
  label: string;
  suffix?: string;
}

export function getQuickOptionsForNoteUnit(unit: NoteUnit): QuickOption[] {
  if (unit === 'soat') {
    return [5, 6, 7, 8, 9, 10].map((hours) => ({
      value: String(hours),
      label: String(hours),
      suffix: 'soat',
    }));
  }

  return [15, 30, 45, 60, 90, 120].map((minutes) => ({
    value: String(minutes),
    label: String(minutes),
    suffix: 'minut',
  }));
}

/** @deprecated Use getQuickOptionsForNoteUnit */
export function getQuickOptionsForIndicator(habit: GoodHabit): QuickOption[] {
  return getQuickOptionsForNoteUnit('soat');
}

export function getTodayIndicatorEntry(
  history: HabitHistoryEntry[],
  habitId: string
): HabitHistoryEntry | null {
  const date = todayKey();
  return history.find((entry) => entry.habitId === habitId && entry.date === date) ?? null;
}

export function getIndicatorStatusLabel(
  habit: GoodHabit,
  history: HabitHistoryEntry[]
): string {
  const todayEntry = getTodayIndicatorEntry(history, habit.id);
  if (todayEntry?.valueLabel) return todayEntry.valueLabel;
  if (habit.todayIndicatorValue) {
    return resolveIndicatorLabel(habit, habit.todayIndicatorValue);
  }
  return 'Kiritilmagan';
}

export function getNoteUnitForHabit(
  habit: GoodHabit,
  history: HabitHistoryEntry[]
): NoteUnit {
  const todayEntry = getTodayIndicatorEntry(history, habit.id);
  if (todayEntry?.valueId) {
    const parsed = parseIndicatorValue(todayEntry.valueId);
    if (parsed && 'numeric' in parsed) return parsed.unit;
  }
  if (todayEntry?.valueLabel) {
    const fromLabel = noteUnitFromLabel(todayEntry.valueLabel);
    if (fromLabel) return fromLabel;
  }
  if (habit.todayIndicatorValue) {
    const parsed = parseIndicatorValue(habit.todayIndicatorValue);
    if (parsed && 'numeric' in parsed) return parsed.unit;
  }
  return 'soat';
}

export function isIndicatorLoggedToday(
  habit: GoodHabit,
  history: HabitHistoryEntry[]
): boolean {
  return !!getTodayIndicatorEntry(history, habit.id);
}

export function isIndicatorSkippedToday(
  habit: GoodHabit,
  history: HabitHistoryEntry[]
): boolean {
  const entry = getTodayIndicatorEntry(history, habit.id);
  return !!entry?.isEmpty || entry?.valueId === 'skip';
}

export function getIndicatorStreak(
  history: HabitHistoryEntry[],
  habitId: string
): number {
  const dates = new Set(
    history
      .filter((entry) => entry.habitId === habitId && entry.kind === 'indicator')
      .map((entry) => entry.date)
  );

  let streak = 0;
  const cursor = new Date();

  for (;;) {
    const key = getLocalDateKey(cursor);
    if (!dates.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function addIndicatorHistoryEntry(
  history: HabitHistoryEntry[],
  habit: GoodHabit,
  value: string,
  valueLabel: string,
  isEmpty: boolean
): HabitHistoryEntry[] {
  const date = todayKey();
  const withoutToday = history.filter(
    (entry) => !(entry.habitId === habit.id && entry.date === date)
  );

  const parsed = isEmpty ? null : parseIndicatorValue(value);
  const numericValue =
    parsed && 'numeric' in parsed ? parsed.numeric : Number(value);

  return [
    {
      id: `${habit.id}_${date}_${Date.now()}`,
      habitId: habit.id,
      habitName: habit.name,
      date,
      completedAt: new Date().toISOString(),
      kind: 'indicator',
      valueId: isEmpty ? 'skip' : value,
      numericValue: Number.isNaN(numericValue) ? undefined : numericValue,
      valueLabel,
      isEmpty,
    },
    ...withoutToday,
  ];
}

export function getIndicatorStatusTone(
  habit: GoodHabit,
  history: HabitHistoryEntry[]
): 'empty' | 'skipped' | 'logged' {
  if (!isIndicatorLoggedToday(habit, history)) return 'empty';
  if (isIndicatorSkippedToday(habit, history)) return 'skipped';
  return 'logged';
}

export function normalizeHabit(habit: GoodHabit): GoodHabit {
  if (habit.kind === 'indicator') {
    return {
      ...habit,
      completedToday: false,
      todayIndicatorValue: habit.todayIndicatorValue ?? null,
    };
  }
  return { ...habit, kind: 'practice' };
}

export function normalizeHabits(habits: GoodHabit[]): GoodHabit[] {
  return habits.map(normalizeHabit);
}
