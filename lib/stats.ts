import type { Dominant, GoodHabit, HabitHistoryEntry } from './types';
import type { ActivityBar } from './activityStats';
import {
  type ArchiveDateFilter,
  getArchiveFilterDateKeys,
} from './habits';
import { getDayCompletionRate } from './completionHeat';

export interface StatTableRow {
  id: string;
  name: string;
  completed: number;
  missed: number;
  skipped: number;
  totalDays: number;
  rate: number;
  detail?: string;
}

export interface StatSummary {
  completed: number;
  missed: number;
  skipped: number;
  totalSlots: number;
  rate: number;
  dayCount: number;
}

function isPracticeDone(entry: HabitHistoryEntry): boolean {
  return !entry.isEmpty && entry.valueId !== 'skip';
}

function isIndicatorSkipped(entry: HabitHistoryEntry): boolean {
  return !!entry.isEmpty || entry.valueId === 'skip';
}

export function getHabitStatSummary(
  habits: GoodHabit[],
  history: HabitHistoryEntry[],
  filter: ArchiveDateFilter,
  kind: 'practice' | 'indicator'
): StatSummary {
  const dates = getArchiveFilterDateKeys(filter);
  const habitIds = new Set(habits.map((h) => h.id));
  let completed = 0;
  let missed = 0;
  let skipped = 0;

  for (const date of dates) {
    for (const habit of habits) {
      const entry = history.find(
        (e) =>
          e.habitId === habit.id &&
          e.date === date &&
          habitIds.has(e.habitId) &&
          (e.kind ?? 'practice') === kind
      );

      if (!entry) {
        missed += 1;
        continue;
      }

      if (kind === 'practice') {
        if (isPracticeDone(entry)) completed += 1;
        else missed += 1;
      } else if (isIndicatorSkipped(entry)) {
        skipped += 1;
      } else {
        completed += 1;
      }
    }
  }

  const totalSlots = habits.length * dates.length;
  const rate = getDayCompletionRate(completed, totalSlots);

  return { completed, missed, skipped, totalSlots, rate, dayCount: dates.length };
}

export function getHabitDailyBars(
  habits: GoodHabit[],
  history: HabitHistoryEntry[],
  filter: ArchiveDateFilter,
  kind: 'practice' | 'indicator'
): ActivityBar[] {
  const dates = getArchiveFilterDateKeys(filter).sort();
  const habitIds = new Set(habits.map((h) => h.id));
  const weekdays = ['yak', 'dush', 'sesh', 'chor', 'pay', 'jum', 'shan'];

  return dates.map((dateKey) => {
    const dayEntries = history.filter(
      (e) =>
        e.date === dateKey &&
        habitIds.has(e.habitId) &&
        (e.kind ?? 'practice') === kind
    );

    const value =
      kind === 'practice'
        ? dayEntries.filter(isPracticeDone).length
        : dayEntries.filter((e) => !isIndicatorSkipped(e)).length;

    const d = new Date(`${dateKey}T12:00:00`);
    const shortLabel =
      dates.length > 10
        ? String(d.getDate())
        : `${d.getDate()}.${d.getMonth() + 1} · ${weekdays[d.getDay()]}`;

    return {
      label: shortLabel,
      value,
      hint: dateKey,
    };
  });
}

export function getHabitStatRows(
  habits: GoodHabit[],
  history: HabitHistoryEntry[],
  filter: ArchiveDateFilter,
  kind: 'practice' | 'indicator'
): StatTableRow[] {
  const dates = getArchiveFilterDateKeys(filter);

  return habits.map((habit) => {
    let completed = 0;
    let missed = 0;
    let skipped = 0;
    let lastLabel: string | undefined;

    for (const date of dates) {
      const entry = history.find(
        (e) =>
          e.habitId === habit.id &&
          e.date === date &&
          (e.kind ?? 'practice') === kind
      );

      if (!entry) {
        missed += 1;
        continue;
      }

      if (kind === 'practice') {
        if (isPracticeDone(entry)) completed += 1;
        else missed += 1;
      } else if (isIndicatorSkipped(entry)) {
        skipped += 1;
        lastLabel = entry.valueLabel;
      } else {
        completed += 1;
        lastLabel = entry.valueLabel;
      }
    }

    const totalDays = dates.length;
    const rate = getDayCompletionRate(
      kind === 'indicator' ? completed + skipped : completed,
      totalDays
    );

    return {
      id: habit.id,
      name: habit.name,
      completed,
      missed,
      skipped,
      totalDays,
      rate,
      detail:
        kind === 'indicator' && lastLabel
          ? `Oxirgi: ${lastLabel}`
          : habit.streak > 0
            ? `🔥 ${habit.streak} kun`
            : undefined,
    };
  });
}

export function getDominantSummary(dominants: Dominant[]): StatSummary {
  const completed = dominants.reduce((sum, d) => sum + (d.sessionsCompleted || 0), 0);
  return {
    completed,
    missed: 0,
    skipped: 0,
    totalSlots: completed,
    rate: dominants.length > 0 ? Math.round(completed / dominants.length) : 0,
    dayCount: dominants.length,
  };
}

export function getDominantBars(dominants: Dominant[]): ActivityBar[] {
  return dominants.map((d) => ({
    label: d.title.length > 12 ? `${d.title.slice(0, 11)}…` : d.title,
    value: d.sessionsCompleted || 0,
    hint: d.title,
  }));
}

export function getDominantStatRows(dominants: Dominant[]): StatTableRow[] {
  const maxSessions = Math.max(...dominants.map((d) => d.sessionsCompleted || 0), 1);

  return dominants.map((d) => ({
    id: d.id,
    name: d.title,
    completed: d.sessionsCompleted || 0,
    missed: 0,
    skipped: 0,
    totalDays: maxSessions,
    rate: Math.round(((d.sessionsCompleted || 0) / maxSessions) * 100),
    detail: d.type === 'fikrlash' ? 'Fikrlash' : "Ma'lumot",
  }));
}
