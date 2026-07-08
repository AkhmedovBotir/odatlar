export interface ServerXPAward {
  xp_reward?: number;
  xp?: number;
  level?: number;
}

export function hasServerXPAward(item: ServerXPAward): boolean {
  return item.xp_reward !== undefined || item.xp !== undefined || item.level !== undefined;
}

export function getLevelProgress(xp: number, levelUpXp: number) {
  const threshold = Math.max(levelUpXp, 1);
  const progressXp = xp % threshold;
  return {
    progressXp,
    threshold,
    percent: (progressXp / threshold) * 100,
  };
}

export function profileDisplayName(profile: {
  first_name?: string;
  last_name?: string;
  username?: string;
}): string {
  const fullName = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
  if (fullName) return fullName;
  if (profile.username?.trim()) return `@${profile.username.trim()}`;
  return 'Foydalanuvchi';
}
