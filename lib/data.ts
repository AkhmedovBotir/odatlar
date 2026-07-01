import type { UserData } from './types';
import { generateSeedHistory } from './habits';

const STORAGE_KEY = 'clubAppData';

export function applyDailyReset(data: UserData): UserData {
  const today = new Date().toDateString();
  if (data.lastResetDate === today) return data;

  return {
    ...data,
    lastResetDate: today,
    goodHabits: data.goodHabits.map((habit) => ({
      ...habit,
      completedToday: false,
    })),
  };
}

export function buildInitialUserData(mock: Record<string, unknown>): UserData {
  const user = mock.user as UserData;
  const goodHabits = mock.goodHabits as UserData['goodHabits'];
  return {
    name: user.name,
    level: user.level,
    xp: user.xp,
    nextLevelXp: user.nextLevelXp,
    coins: user.coins,
    badges: user.badges,
    goodHabits,
    habitHistory: generateSeedHistory(goodHabits),
    dominants: mock.dominants as UserData['dominants'],
    leaderboard: mock.leaderboard as UserData['leaderboard'],
    lastResetDate: new Date().toDateString(),
  };
}

export async function loadUserData(): Promise<UserData> {
  const response = await fetch('/mockup.json');
  if (!response.ok) throw new Error('Ma\'lumotlarni yuklab bo\'lmadi');

  const mock = await response.json();
  const merged = buildInitialUserData(mock);

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as UserData;
      const { clubTasks: _removed, ...rest } = parsed as UserData & { clubTasks?: unknown };
      const withLeaderboard = {
        ...rest,
        leaderboard: merged.leaderboard,
        habitHistory: rest.habitHistory?.length
          ? rest.habitHistory
          : generateSeedHistory(rest.goodHabits ?? merged.goodHabits),
      };
      return applyDailyReset(withLeaderboard);
    }
  } catch {
    // corrupted storage — fall back to fresh data
  }

  return applyDailyReset(merged);
}

export function saveUserData(data: UserData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export const DRAFT_KEY = 'dominantDraft';
