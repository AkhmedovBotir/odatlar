import type { HabitHistoryEntry } from './types';
import { getLocalDateKey, todayKey } from './habits';

export interface ActivityBar {
  label: string;
  value: number;
  hint?: string;
}

function isActiveEntry(entry: HabitHistoryEntry): boolean {
  return !entry.isEmpty && entry.valueId !== 'skip';
}

function countActiveByDate(history: HabitHistoryEntry[], date: string): number {
  return history.filter((entry) => entry.date === date && isActiveEntry(entry)).length;
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return getLocalDateKey(d);
}

function formatDayLabel(dateKey: string): string {
  const today = todayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDateKey(yesterday);

  if (dateKey === today) return 'Bugun';
  if (dateKey === yesterdayKey) return 'Kecha';

  const date = new Date(`${dateKey}T12:00:00`);
  const weekdays = ['yak', 'dush', 'sesh', 'chor', 'pay', 'jum', 'shan'];
  return `${date.getDate()}.${date.getMonth() + 1} · ${weekdays[date.getDay()]}`;
}

export function getDailyActivity(
  history: HabitHistoryEntry[],
  days = 7
): ActivityBar[] {
  const bars: ActivityBar[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDateKey(d);
    bars.push({
      label: formatDayLabel(key),
      value: countActiveByDate(history, key),
      hint: key,
    });
  }

  return bars;
}

export function getWeeklyActivity(
  history: HabitHistoryEntry[],
  weeks = 8
): ActivityBar[] {
  const map = new Map<string, number>();
  const today = new Date();

  for (let i = 0; i < weeks; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    const weekStart = getWeekStart(d);
    if (!map.has(weekStart)) map.set(weekStart, 0);
  }

  for (const entry of history) {
    if (!isActiveEntry(entry)) continue;
    const weekStart = getWeekStart(new Date(`${entry.date}T12:00:00`));
    if (map.has(weekStart)) {
      map.set(weekStart, (map.get(weekStart) ?? 0) + 1);
    }
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, value]) => {
      const date = new Date(`${weekStart}T12:00:00`);
      return {
        label: `${date.getDate()}.${date.getMonth() + 1}`,
        value,
        hint: `Hafta boshlanishi: ${weekStart}`,
      };
    });
}

export function getMonthlyActivity(
  history: HabitHistoryEntry[],
  months = 6
): ActivityBar[] {
  const monthKeys: string[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthKeys.push(key);
  }

  const counts = new Map(monthKeys.map((key) => [key, 0]));

  for (const entry of history) {
    if (!isActiveEntry(entry)) continue;
    const key = entry.date.slice(0, 7);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }

  const monthNames = [
    'yan',
    'fev',
    'mar',
    'apr',
    'may',
    'iyn',
    'iyl',
    'avg',
    'sen',
    'okt',
    'noy',
    'dek',
  ];

  return monthKeys.map((key) => {
    const [, month] = key.split('-');
    const monthIndex = Number(month) - 1;
    return {
      label: monthNames[monthIndex] ?? month,
      value: counts.get(key) ?? 0,
      hint: key,
    };
  });
}

export function getActivitySummary(bars: ActivityBar[]) {
  const total = bars.reduce((sum, bar) => sum + bar.value, 0);
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const average = bars.length > 0 ? Math.round((total / bars.length) * 10) / 10 : 0;
  return { total, max, average };
}
