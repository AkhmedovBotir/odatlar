'use client';

import type { StatTableRow } from '@/lib/stats';

type StatsTableVariant = 'practice' | 'indicator' | 'dominant';

interface StatsTableProps {
  rows: StatTableRow[];
  variant: StatsTableVariant;
  emptyLabel?: string;
}

const headers: Record<
  StatsTableVariant,
  { name: string; done: string; missed: string; extra?: string }
> = {
  practice: { name: 'Amaliyot', done: 'Bajarilgan', missed: 'Bajarilmagan' },
  indicator: { name: 'Indikator', done: 'Kiritilgan', missed: 'Kiritilmagan', extra: 'O\'tkazilgan' },
  dominant: { name: 'Dominanta', done: 'Sessiyalar', missed: '—' },
};

export default function StatsTable({
  rows,
  variant,
  emptyLabel = "Ma'lumot yo'q",
}: StatsTableProps) {
  const h = headers[variant];
  const accent =
    variant === 'indicator'
      ? 'text-cyan-400'
      : variant === 'dominant'
        ? 'text-violet-400'
        : 'text-emerald-400';

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 px-4 py-10 text-center text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/40">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700/60 bg-slate-900/50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">{h.name}</th>
              <th className="px-3 py-3 text-center">{h.done}</th>
              {variant === 'indicator' && (
                <th className="px-3 py-3 text-center">{h.extra}</th>
              )}
              {variant !== 'dominant' && (
                <th className="px-3 py-3 text-center">{h.missed}</th>
              )}
              <th className="px-4 py-3 text-right">
                {variant === 'dominant' ? 'Ulushi' : 'Foiz'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-800/50">
                <td className="px-4 py-3">
                  <p className="font-semibold text-white">{row.name}</p>
                  {row.detail && (
                    <p className="mt-0.5 text-xs text-slate-500">{row.detail}</p>
                  )}
                </td>
                <td className={`px-3 py-3 text-center font-bold tabular-nums ${accent}`}>
                  {variant === 'dominant' ? row.completed : row.completed}
                </td>
                {variant === 'indicator' && (
                  <td className="px-3 py-3 text-center font-bold tabular-nums text-amber-400">
                    {row.skipped}
                  </td>
                )}
                {variant !== 'dominant' && (
                  <td className="px-3 py-3 text-center font-bold tabular-nums text-red-400">
                    {row.missed}
                  </td>
                )}
                <td className={`px-4 py-3 text-right font-bold tabular-nums ${accent}`}>
                  {`${row.rate}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
