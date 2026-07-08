'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Archive,
  BarChart3,
  Calendar,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from 'lucide-react';
import type { ArchiveDayItem } from '@/lib/habits';
import {
  formatArchiveDate,
  formatDateTime,
  formatDateTimeCompact,
  todayKey,
} from '@/lib/habits';
import { getCompletionHeatClass, getDayCompletionRate } from '@/lib/completionHeat';
import { getHabitColor } from '@/lib/habitColors';
import HabitTabNav from '@/components/habits/HabitTabNav';
import ArchiveFilterModal, { ArchiveFilterButton } from '@/components/habits/ArchiveFilterModal';
import type { ArchiveDateFilter } from '@/lib/habits';

type ArchiveKind = 'amaliyotlar' | 'indikatorlar';

const archiveTabs: {
  id: ArchiveKind;
  label: string;
  shortLabel: string;
  icon: typeof CheckCircle2;
}[] = [
  { id: 'amaliyotlar', label: 'Amaliyotlar', shortLabel: 'Amal.', icon: CheckCircle2 },
  { id: 'indikatorlar', label: 'Indikatorlar', shortLabel: 'Indik.', icon: BarChart3 },
];

interface ArchivePanelProps {
  dateFilter: ArchiveDateFilter;
  archiveKind: ArchiveKind;
  archiveDays: { date: string; items: ArchiveDayItem[] }[];
  completedCount: number;
  missedCount: number;
  hasHabits: boolean;
  onDateFilterChange: (filter: ArchiveDateFilter) => void;
  onArchiveKindChange: (kind: ArchiveKind) => void;
}

function StatChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'emerald' | 'cyan' | 'red' | 'neutral';
}) {
  const styles = {
    emerald: 'border-emerald-900/50 bg-emerald-950/30 text-emerald-400',
    cyan: 'border-cyan-900/50 bg-cyan-950/30 text-cyan-400',
    red: 'border-red-900/50 bg-red-950/30 text-red-400',
    neutral: 'border-slate-700/60 bg-slate-800/60 text-slate-200',
  };

  return (
    <div
      className={`flex min-w-[4.5rem] flex-col items-center justify-center rounded-lg border px-2.5 py-1.5 ${styles[tone]}`}
    >
      <span className="text-[9px] font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="text-sm font-bold tabular-nums leading-tight">{value}</span>
    </div>
  );
}

function ArchiveItemRow({
  item,
  archiveKind,
}: {
  item: ArchiveDayItem;
  archiveKind: ArchiveKind;
}) {
  const color = getHabitColor(item.habitId);
  const isMissed = item.status === 'missed';
  const isSkipped =
    item.status === 'completed' && item.valueLabel === 'Bajarilmadi';
  const isIndicator = item.kind === 'indicator' || archiveKind === 'indikatorlar';

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${
        isMissed
          ? 'bg-red-950/20 border border-red-900/25'
          : isSkipped
            ? 'bg-amber-950/25 border border-amber-900/30'
            : isIndicator
              ? 'bg-cyan-950/20 border border-cyan-900/25'
              : 'bg-emerald-950/25 border border-emerald-900/30'
      }`}
    >
      <div
        className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
          isMissed
            ? 'bg-red-950/60 text-red-400'
            : isSkipped
              ? 'bg-amber-950/60 text-amber-400'
              : isIndicator
                ? 'bg-cyan-950/60 text-cyan-400'
                : 'bg-emerald-950/60 text-emerald-400'
        }`}
      >
        {isMissed ? (
          <XCircle className="h-4 w-4" />
        ) : isSkipped ? (
          <MinusCircle className="h-4 w-4" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-semibold ${
            isMissed ? 'text-slate-400' : 'text-white'
          }`}
        >
          {item.habitName}
        </p>
        <p
          className={`mt-0.5 text-xs ${
            isMissed
              ? 'text-red-300/80'
              : isSkipped
                ? 'text-amber-300/90'
                : 'text-slate-400'
          }`}
        >
          {isMissed ? (
            item.date === todayKey() ? (
              isIndicator ? 'Hali kiritilmagan' : 'Hali bajarilmagan'
            ) : isIndicator ? (
              'Kiritilmagan'
            ) : (
              'Bajarilmagan'
            )
          ) : item.valueLabel ? (
            item.valueLabel
          ) : item.completedAt ? (
            <>
              <span className="sm:hidden">{formatDateTimeCompact(item.completedAt)}</span>
              <span className="hidden sm:inline">{formatDateTime(item.completedAt)}</span>
            </>
          ) : (
            'Bajarildi'
          )}
        </p>
      </div>

      {!isMissed && (
        <div className={`h-2 w-2 flex-shrink-0 rounded-full ${color.dot}`} />
      )}
    </div>
  );
}

function ArchiveDayCard({
  group,
  archiveKind,
}: {
  group: { date: string; items: ArchiveDayItem[] };
  archiveKind: ArchiveKind;
}) {
  const variant = archiveKind === 'indikatorlar' ? 'indicator' : 'practice';
  const completed = group.items.filter((i) => i.status === 'completed').length;
  const rate = getDayCompletionRate(completed, group.items.length);
  const isToday = group.date === todayKey();
  const completedItems = group.items.filter((i) => i.status === 'completed');
  const missedItems = group.items.filter((i) => i.status === 'missed');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-slate-800/80 to-slate-900/70 shadow-sm"
    >
      <div className="border-b border-slate-700/50 px-4 py-3.5">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0 text-blue-400" />
              {isToday && (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-300">
                  Bugun
                </span>
              )}
            </div>
            <p className="text-sm font-bold leading-snug text-white sm:text-base">
              {formatArchiveDate(group.date)}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-col items-end">
            <span
              className={`text-lg font-bold tabular-nums ${
                variant === 'indicator' ? 'text-cyan-400' : 'text-emerald-400'
              }`}
            >
              {rate}%
            </span>
            <span className="text-[11px] text-slate-500">
              {completed}/{group.items.length}
            </span>
          </div>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
          <div
            className={`h-full rounded-full transition-all ${getCompletionHeatClass(rate, variant)}`}
            style={{ width: `${Math.max(rate, rate > 0 ? 8 : 0)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 p-3">
        {completedItems.length > 0 && (
          <div className="space-y-1.5">
            {completedItems.map((item) => (
              <ArchiveItemRow key={item.id} item={item} archiveKind={archiveKind} />
            ))}
          </div>
        )}
        {missedItems.length > 0 && (
          <div className="space-y-1.5">
            {completedItems.length > 0 && (
              <p className="px-1 pt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Qolgan
              </p>
            )}
            {missedItems.map((item) => (
              <ArchiveItemRow key={item.id} item={item} archiveKind={archiveKind} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ArchivePanel({
  dateFilter,
  archiveKind,
  archiveDays,
  completedCount,
  missedCount,
  hasHabits,
  onDateFilterChange,
  onArchiveKindChange,
}: ArchivePanelProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const variant = archiveKind === 'indikatorlar' ? 'indicator' : 'practice';
  const totalItems = completedCount + missedCount;
  const overallRate = getDayCompletionRate(completedCount, totalItems);
  const doneLabel = archiveKind === 'indikatorlar' ? 'Kiritilgan' : 'Bajarilgan';
  const missedLabel = archiveKind === 'indikatorlar' ? 'Kiritilmagan' : 'Bajarilmagan';
  const accentTone = variant === 'indicator' ? 'cyan' : 'emerald';

  const handleFilterChange = (next: ArchiveDateFilter) => {
    onDateFilterChange(next);
  };

  return (
    <div>
      <HabitTabNav
        tabs={archiveTabs}
        activeTab={archiveKind}
        onChange={onArchiveKindChange}
        layoutId="archiveKindTab"
        constrained
        action={
          <ArchiveFilterButton onClick={() => setFilterOpen(true)} isActive={filterOpen} />
        }
      />

      <ArchiveFilterModal
        open={filterOpen}
        value={dateFilter}
        onChange={handleFilterChange}
        onClose={() => setFilterOpen(false)}
      />

      {hasHabits && (
        <div className="mb-4 max-w-lg">
          <div className="flex flex-wrap gap-2">
            <StatChip label="Foiz" value={`${overallRate}%`} tone={accentTone} />
            <StatChip label={doneLabel} value={completedCount} tone={accentTone} />
            <StatChip label={missedLabel} value={missedCount} tone="red" />
            <StatChip label="Kunlar" value={archiveDays.length} tone="neutral" />
          </div>
        </div>
      )}

      {!hasHabits ? (
        <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 px-6 py-14 text-center">
          <Archive className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <p className="font-medium text-slate-300">
            {archiveKind === 'indikatorlar'
              ? "Hali indikatorlar yo'q"
              : "Hali amaliyotlar yo'q"}
          </p>
        </div>
      ) : archiveDays.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 px-6 py-12 text-center text-slate-400">
          <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>Tanlangan davrda ma&apos;lumot yo&apos;q</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          {archiveDays.map((group) => (
            <ArchiveDayCard key={group.date} group={group} archiveKind={archiveKind} />
          ))}
        </div>
      )}
    </div>
  );
}
