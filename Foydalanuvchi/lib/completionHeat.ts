export type HeatVariant = 'practice' | 'indicator';

/** 0% = och yashil/ko'k, 100% = to'q rang */
export function getCompletionHeatClass(rate: number, variant: HeatVariant = 'practice'): string {
  const clamped = Math.max(0, Math.min(100, rate));

  if (variant === 'indicator') {
    if (clamped === 0) return 'bg-red-950/90 border border-red-900/45';
    if (clamped < 25) return 'bg-cyan-900/90';
    if (clamped < 50) return 'bg-cyan-800';
    if (clamped < 75) return 'bg-cyan-600';
    if (clamped < 100) return 'bg-cyan-500';
    return 'bg-cyan-400 shadow-sm shadow-cyan-500/25';
  }

  if (clamped === 0) return 'bg-red-950/90 border border-red-900/45';
  if (clamped < 25) return 'bg-emerald-900/90';
  if (clamped < 50) return 'bg-emerald-800';
  if (clamped < 75) return 'bg-emerald-600';
  if (clamped < 100) return 'bg-emerald-500';
  return 'bg-emerald-400 shadow-sm shadow-emerald-500/25';
}

export function getDayCompletionRate(completed: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}
