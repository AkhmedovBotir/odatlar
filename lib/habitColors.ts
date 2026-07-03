const HABIT_PALETTE = [
  {
    gradient: 'from-emerald-500/25 to-teal-600/10',
    border: 'border-emerald-500/35',
    accent: 'text-emerald-400',
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-500/40',
  },
  {
    gradient: 'from-blue-500/25 to-cyan-600/10',
    border: 'border-blue-500/35',
    accent: 'text-blue-400',
    dot: 'bg-blue-500',
    ring: 'ring-blue-500/40',
  },
  {
    gradient: 'from-violet-500/25 to-purple-600/10',
    border: 'border-violet-500/35',
    accent: 'text-violet-400',
    dot: 'bg-violet-500',
    ring: 'ring-violet-500/40',
  },
  {
    gradient: 'from-orange-500/25 to-amber-600/10',
    border: 'border-orange-500/35',
    accent: 'text-orange-400',
    dot: 'bg-orange-500',
    ring: 'ring-orange-500/40',
  },
  {
    gradient: 'from-rose-500/25 to-pink-600/10',
    border: 'border-rose-500/35',
    accent: 'text-rose-400',
    dot: 'bg-rose-500',
    ring: 'ring-rose-500/40',
  },
  {
    gradient: 'from-sky-500/25 to-indigo-600/10',
    border: 'border-sky-500/35',
    accent: 'text-sky-400',
    dot: 'bg-sky-500',
    ring: 'ring-sky-500/40',
  },
] as const;

export type HabitColorTheme = (typeof HABIT_PALETTE)[number];

export function getHabitColor(id: string): HabitColorTheme {
  const index =
    [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % HABIT_PALETTE.length;
  return HABIT_PALETTE[index];
}
