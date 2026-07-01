export interface GoodHabit {
  id: string;
  name: string;
  benefits: string[];
  completedToday: boolean;
  streak: number;
}

export interface HabitHistoryEntry {
  id: string;
  habitId: string;
  habitName: string;
  date: string;
  completedAt: string;
}

export interface Dominant {
  id: string;
  title: string;
  type: 'fikrlash' | 'ma\'lumot';
  cue: string;
  reward: string;
  pros: string[];
  cons: string[];
  notes?: string;
  sessionsCompleted: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  level: number;
}

export interface UserData {
  name: string;
  level: number;
  xp: number;
  nextLevelXp: number;
  coins: number;
  badges: string[];
  goodHabits: GoodHabit[];
  habitHistory: HabitHistoryEntry[];
  dominants: Dominant[];
  leaderboard: LeaderboardEntry[];
  lastResetDate?: string;
}

export interface DominantDraft {
  title: string;
  cue: string;
  reward: string;
}
