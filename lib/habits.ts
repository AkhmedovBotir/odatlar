import type { GoodHabit, HabitHistoryEntry } from './types';
import {
  formatUzbekDateFromKey,
  formatUzbekDateTime,
  formatUzbekDateTimeCompact,
} from './datetime';

export type HistoryPeriod = '1d' | '7d' | '15d' | '30d' | 'all';

export const PERIOD_OPTIONS: { id: HistoryPeriod; label: string; days: number | null }[] = [
  { id: '1d', label: '1 kun', days: 1 },
  { id: '7d', label: '1 hafta', days: 7 },
  { id: '15d', label: '15 kun', days: 15 },
  { id: '30d', label: '1 oy', days: 30 },
  { id: 'all', label: 'Hammasi', days: null },
];

export function getPeriodLabel(period: HistoryPeriod): string {
  return PERIOD_OPTIONS.find((p) => p.id === period)?.label ?? '1 hafta';
}

export function getPeriodDayCount(period: HistoryPeriod): number | null {
  return PERIOD_OPTIONS.find((p) => p.id === period)?.days ?? null;
}

export function getDateRangeForPeriod(period: HistoryPeriod): Set<string> | null {
  const days = getPeriodDayCount(period);
  if (days === null) return null;

  const dates = new Set<string>();
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.add(getLocalDateKey(d));
  }
  return dates;
}

export function filterHistoryByPeriod(
  history: HabitHistoryEntry[],
  period: HistoryPeriod
): HabitHistoryEntry[] {
  const range = getDateRangeForPeriod(period);
  if (!range) return history;
  return history.filter((entry) => range.has(entry.date));
}

export function getHabitCompletionCountInPeriod(
  history: HabitHistoryEntry[],
  habitId: string,
  period: HistoryPeriod
): number {
  return filterHistoryByPeriod(history, period).filter((entry) => entry.habitId === habitId)
    .length;
}

export function getHabitPeriodRate(
  history: HabitHistoryEntry[],
  habitId: string,
  period: HistoryPeriod
): number {
  const days = getPeriodDayCount(period);
  const filtered = filterHistoryByPeriod(history, period).filter(
    (entry) => entry.habitId === habitId
  );

  if (days === null) {
    const uniqueDays = new Set(filtered.map((entry) => entry.date)).size;
    if (uniqueDays === 0) return 0;
    const firstDate = filtered.map((e) => e.date).sort()[0];
    const span =
      Math.ceil(
        (new Date(todayKey()).getTime() - new Date(`${firstDate}T12:00:00`).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;
    return Math.min(100, Math.round((uniqueDays / Math.max(span, 1)) * 100));
  }

  const completedDays = new Set(filtered.map((entry) => entry.date)).size;
  return Math.round((completedDays / days) * 100);
}

export function getOverallPeriodRate(
  history: HabitHistoryEntry[],
  habitCount: number,
  period: HistoryPeriod
): number {
  if (habitCount === 0) return 0;

  const filtered = filterHistoryByPeriod(history, period);
  const days = getPeriodDayCount(period);

  if (days === null) {
    if (filtered.length === 0) return 0;
    const uniqueDays = new Set(filtered.map((entry) => entry.date)).size;
    return Math.round((filtered.length / (habitCount * Math.max(uniqueDays, 1))) * 100);
  }

  return Math.round((filtered.length / (habitCount * days)) * 100);
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return getLocalDateKey();
}

export function formatArchiveDate(dateKey: string): string {
  const full = formatUzbekDateFromKey(dateKey);

  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  if (dateKey === today) return `Bugun — ${full}`;
  if (dateKey === yesterdayKey) return `Kecha — ${full}`;
  return full;
}

export function formatDateOnly(dateKey: string): string {
  return formatUzbekDateFromKey(dateKey);
}

export function formatDateTime(iso: string): string {
  return formatUzbekDateTime(iso, { weekday: 'short', withSeconds: true });
}

export function formatDateTimeCompact(iso: string): string {
  return formatUzbekDateTimeCompact(iso);
}

export function formatTime(iso: string): string {
  return formatDateTime(iso);
}

export interface ArchiveDayItem {
  id: string;
  habitId: string;
  habitName: string;
  status: 'completed' | 'missed';
  completedAt?: string;
  date: string;
}

export function getPeriodDateList(
  period: HistoryPeriod,
  history: HabitHistoryEntry[]
): string[] {
  const dayCount = getPeriodDayCount(period);
  if (dayCount !== null) {
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < dayCount; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(getLocalDateKey(d));
    }
    return dates;
  }

  const dates = new Set<string>(history.map((entry) => entry.date));
  dates.add(todayKey());
  return Array.from(dates).sort((a, b) => b.localeCompare(a));
}

export function buildArchiveDays(
  habits: GoodHabit[],
  history: HabitHistoryEntry[],
  period: HistoryPeriod
): { date: string; items: ArchiveDayItem[] }[] {
  if (habits.length === 0) return [];

  return getPeriodDateList(period, history).map((date) => {
    const completedEntries = history.filter((entry) => entry.date === date);
    const completedIds = new Set(completedEntries.map((entry) => entry.habitId));

    const completedItems: ArchiveDayItem[] = completedEntries.map((entry) => ({
      id: entry.id,
      habitId: entry.habitId,
      habitName: entry.habitName,
      status: 'completed',
      completedAt: entry.completedAt,
      date,
    }));

    const missedItems: ArchiveDayItem[] = habits
      .filter((habit) => !completedIds.has(habit.id))
      .map((habit) => ({
        id: `missed_${habit.id}_${date}`,
        habitId: habit.id,
        habitName: habit.name,
        status: 'missed',
        date,
      }));

    return {
      date,
      items: [
        ...completedItems.sort(
          (a, b) =>
            new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
        ),
        ...missedItems.sort((a, b) => a.habitName.localeCompare(b.habitName)),
      ],
    };
  });
}

export function generateSeedHistory(habits: GoodHabit[]): HabitHistoryEntry[] {
  const entries: HabitHistoryEntry[] = [];

  for (const habit of habits) {
    if (habit.streak === 0 && !habit.completedToday) continue;

    const daysToLog = habit.completedToday ? habit.streak : habit.streak;
    for (let i = 0; i < Math.max(daysToLog, habit.completedToday ? 1 : 0); i++) {
      const d = new Date();
      d.setDate(d.getDate() - (habit.completedToday ? i : i + 1));
      d.setHours(8 + (i % 5), 30, 0, 0);
      const date = getLocalDateKey(d);
      entries.push({
        id: `${habit.id}_${date}`,
        habitId: habit.id,
        habitName: habit.name,
        date,
        completedAt: d.toISOString(),
      });
    }
  }

  return entries.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

export function addHistoryEntry(
  history: HabitHistoryEntry[],
  habit: GoodHabit
): HabitHistoryEntry[] {
  const date = todayKey();
  const withoutToday = history.filter(
    (entry) => !(entry.habitId === habit.id && entry.date === date)
  );
  return [
    {
      id: `${habit.id}_${date}_${Date.now()}`,
      habitId: habit.id,
      habitName: habit.name,
      date,
      completedAt: new Date().toISOString(),
    },
    ...withoutToday,
  ];
}

export function removeTodayHistoryEntry(
  history: HabitHistoryEntry[],
  habitId: string
): HabitHistoryEntry[] {
  const date = todayKey();
  return history.filter((entry) => !(entry.habitId === habitId && entry.date === date));
}

export function getHabitCompletionCount(
  history: HabitHistoryEntry[],
  habitId: string
): number {
  return history.filter((entry) => entry.habitId === habitId).length;
}

export function getLastCompletedDate(
  history: HabitHistoryEntry[],
  habitId: string
): string | null {
  const entry = getLastCompletedEntry(history, habitId);
  return entry?.date ?? null;
}

export function getLastCompletedEntry(
  history: HabitHistoryEntry[],
  habitId: string
): HabitHistoryEntry | null {
  const entries = history.filter((item) => item.habitId === habitId);
  if (entries.length === 0) return null;
  return entries.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )[0];
}

export function getWeeklyCompletionRate(
  history: HabitHistoryEntry[],
  habitId: string
): number {
  const dates = new Set<string>();
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.add(getLocalDateKey(d));
  }
  const completedDays = history.filter(
    (entry) => entry.habitId === habitId && dates.has(entry.date)
  ).length;
  return Math.round((completedDays / 7) * 100);
}

export function groupHistoryByDate(
  history: HabitHistoryEntry[]
): { date: string; entries: HabitHistoryEntry[] }[] {
  const map = new Map<string, HabitHistoryEntry[]>();
  for (const entry of history) {
    const list = map.get(entry.date) ?? [];
    list.push(entry);
    map.set(entry.date, list);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, entries]) => ({
      date,
      entries: entries.sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      ),
    }));
}

export function getOverallWeeklyRate(
  history: HabitHistoryEntry[],
  habitCount: number
): number {
  if (habitCount === 0) return 0;
  const dates = new Set<string>();
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.add(getLocalDateKey(d));
  }
  const completions = history.filter((entry) => dates.has(entry.date)).length;
  return Math.round((completions / (habitCount * 7)) * 100);
}
