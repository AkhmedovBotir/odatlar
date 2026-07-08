import type { GoodHabit, LeaderboardEntry, UserData } from './types';

export function applyLevelUp(xp: number, level: number, nextLevelXp: number) {
  let currentXp = Math.max(0, xp);
  let currentLevel = level;
  let threshold = nextLevelXp;
  let leveledUp = false;

  while (currentXp >= threshold) {
    currentXp -= threshold;
    currentLevel += 1;
    threshold = Math.round(threshold * 1.25);
    leveledUp = true;
  }

  return { xp: currentXp, level: currentLevel, nextLevelXp: threshold, leveledUp };
}

export function updateLeaderboard(
  leaderboard: LeaderboardEntry[],
  userName: string,
  xp: number,
  level: number
): LeaderboardEntry[] {
  const updated = leaderboard.map((entry) =>
    entry.name === userName ? { ...entry, xp, level } : entry
  );

  const sorted = [...updated].sort((a, b) => b.xp - a.xp);
  return sorted.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export function applyGamification(
  userData: UserData,
  { xpDelta = 0 }: { xpDelta?: number; coinsDelta?: number }
): UserData {
  const leveled = applyLevelUp(
    userData.xp + xpDelta,
    userData.level,
    userData.nextLevelXp
  );

  const leaderboard = updateLeaderboard(
    userData.leaderboard,
    userData.name,
    leveled.xp,
    leveled.level
  );

  return {
    ...userData,
    xp: leveled.xp,
    level: leveled.level,
    nextLevelXp: leveled.nextLevelXp,
    leaderboard,
  };
}

export function getBestStreak(habits: GoodHabit[]): number {
  if (habits.length === 0) return 0;
  return Math.max(...habits.map((h) => h.streak));
}

export function getUserRank(userData: UserData): number | null {
  if (userData.currentUserRank) return userData.currentUserRank;
  const entry = userData.leaderboard.find((m) => m.isMe || m.name === userData.name);
  return entry?.rank ?? null;
}
