export type HabitKind = 'practice' | 'indicator';

export interface IndicatorConfig {
  unit?: string;
}

export interface GoodHabit {
  id: string;
  name: string;
  benefits: string[];
  kind?: HabitKind;
  completedToday: boolean;
  streak: number;
  indicatorConfig?: IndicatorConfig;
  todayIndicatorValue?: string | null;
}

export interface HabitHistoryEntry {
  id: string;
  habitId: string;
  habitName: string;
  date: string;
  completedAt: string;
  kind?: HabitKind;
  valueLabel?: string;
  valueId?: string;
  numericValue?: number;
  isEmpty?: boolean;
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
