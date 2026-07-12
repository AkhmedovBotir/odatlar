import type { GoodHabit, HabitHistoryEntry, UserData } from './types';
import { normalizeHabits } from './indicators';

const STORAGE_KEY = 'clubAppData';

/**
 * Bir xil `id` ga ega yozuvlar ro'yxatda bir necha marta paydo bo'lishining oldini oladi.
 * Optimistik yangilanish va backend sinxronizatsiyasi ketma-ket ishlaganda
 * (ayniqsa bir amaliyot/indikatorni takror qo'shganda) dublikatlar hosil bo'lishi mumkin.
 * Oxirgi (eng yangi) nusxa saqlanadi.
 */
function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) {
    map.set(item.id, item);
  }
  return Array.from(map.values());
}

export function dedupeHabits(habits: GoodHabit[]): GoodHabit[] {
  return dedupeById(habits);
}

export function dedupeHistory(history: HabitHistoryEntry[]): HabitHistoryEntry[] {
  return dedupeById(history);
}

export function dedupeUserData(data: UserData): UserData {
  return {
    ...data,
    goodHabits: dedupeHabits(data.goodHabits ?? []),
    habitHistory: dedupeHistory(data.habitHistory ?? []),
  };
}

export function applyDailyReset(data: UserData): UserData {
  const today = new Date().toDateString();
  if (data.lastResetDate === today) return data;

  return {
    ...data,
    lastResetDate: today,
    goodHabits: data.goodHabits.map((habit) => ({
      ...habit,
      completedToday: false,
      todayIndicatorValue: habit.kind === 'indicator' ? null : habit.todayIndicatorValue,
    })),
  };
}

export function createEmptyUserData(): UserData {
  return {
    name: 'Foydalanuvchi',
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    coins: 0,
    badges: [],
    goodHabits: [],
    habitHistory: [],
    dominants: [],
    leaderboard: [],
    lastResetDate: new Date().toDateString(),
  };
}

export async function loadUserData(): Promise<UserData> {
  const empty = createEmptyUserData();

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as UserData;
      const { clubTasks: _removed, ...rest } = parsed as UserData & { clubTasks?: unknown };
      return applyDailyReset(
        dedupeUserData({
          ...empty,
          ...rest,
          goodHabits: normalizeHabits(rest.goodHabits ?? []),
          habitHistory: rest.habitHistory ?? [],
        })
      );
    }
  } catch {
    // corrupted storage — fall back to empty data
  }

  return applyDailyReset(empty);
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const DRAFT_KEY = 'dominantDraft';
