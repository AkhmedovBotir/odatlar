'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Brain, CheckCircle2, Trophy } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import PageContainer from '@/components/PageContainer';
import HabitTabNav from '@/components/habits/HabitTabNav';
import ArchiveFilterModal, { ArchiveFilterButton } from '@/components/habits/ArchiveFilterModal';
import ActivityChart from '@/components/statistics/ActivityChart';
import StatsTable from '@/components/statistics/StatsTable';
import LeaderboardPanel from '@/components/statistics/LeaderboardPanel';
import { getPractices, getIndicators } from '@/lib/indicators';
import {
  parseArchiveDateFilter,
  serializeArchiveDateFilter,
  type ArchiveDateFilter,
} from '@/lib/habits';
import {
  getDominantBars,
  getDominantStatRows,
  getDominantSummary,
  getHabitDailyBars,
  getHabitStatRows,
  getHabitStatSummary,
} from '@/lib/stats';

type StatsTab = 'reyting' | 'amaliyotlar' | 'indikatorlar' | 'dominantalar';

const statsTabs: {
  id: StatsTab;
  label: string;
  shortLabel: string;
  icon: typeof CheckCircle2;
}[] = [
  { id: 'reyting', label: 'Reyting', shortLabel: 'Reyting', icon: Trophy },
  { id: 'amaliyotlar', label: 'Amaliyotlar', shortLabel: 'Amal.', icon: CheckCircle2 },
  { id: 'indikatorlar', label: 'Indikatorlar', shortLabel: 'Indik.', icon: BarChart3 },
  { id: 'dominantalar', label: 'Dominantalar', shortLabel: 'Dom.', icon: Brain },
];

function parseStatsTab(value: string | null): StatsTab {
  if (
    value === 'reyting' ||
    value === 'amaliyotlar' ||
    value === 'indikatorlar' ||
    value === 'dominantalar'
  ) {
    return value;
  }
  return 'reyting';
}

function StatChip({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string | number;
  tone?: 'emerald' | 'cyan' | 'violet' | 'red' | 'neutral';
}) {
  const styles = {
    emerald: 'border-emerald-900/50 bg-emerald-950/30 text-emerald-400',
    cyan: 'border-cyan-900/50 bg-cyan-950/30 text-cyan-400',
    violet: 'border-violet-900/50 bg-violet-950/30 text-violet-400',
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

function StatisticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData } = useUserData();
  const [filterOpen, setFilterOpen] = useState(false);

  if (!userData) return null;

  const activeTab = parseStatsTab(searchParams.get('tab'));
  const history = userData.habitHistory ?? [];
  const dateFilter = parseArchiveDateFilter(searchParams.get('davr'), history);
  const davrParam = serializeArchiveDateFilter(dateFilter);
  const practices = getPractices(userData.goodHabits);
  const indicators = getIndicators(userData.goodHabits);
  const dominants = userData.dominants ?? [];

  const setTab = (tab: StatsTab) => {
    if (tab === 'reyting') {
      router.replace('/statistika?tab=reyting', { scroll: false });
      return;
    }
    if (tab === 'amaliyotlar') {
      router.replace(`/statistika?tab=amaliyotlar&davr=${davrParam}`, { scroll: false });
      return;
    }
    router.replace(`/statistika?tab=${tab}&davr=${davrParam}`, { scroll: false });
  };

  const setDateFilter = (next: ArchiveDateFilter) => {
    router.replace(
      `/statistika?tab=${activeTab}&davr=${serializeArchiveDateFilter(next)}`,
      { scroll: false }
    );
  };

  const practiceSummary = getHabitStatSummary(practices, history, dateFilter, 'practice');
  const indicatorSummary = getHabitStatSummary(indicators, history, dateFilter, 'indicator');
  const dominantSummary = getDominantSummary(dominants);

  const summary =
    activeTab === 'amaliyotlar'
      ? practiceSummary
      : activeTab === 'indikatorlar'
        ? indicatorSummary
        : dominantSummary;

  const accentTone =
    activeTab === 'indikatorlar' ? 'cyan' : activeTab === 'dominantalar' ? 'violet' : 'emerald';

  const chartAccent =
    activeTab === 'indikatorlar' ? 'cyan' : activeTab === 'dominantalar' ? 'violet' : 'emerald';

  return (
    <PageContainer>
      <HabitTabNav
        tabs={statsTabs}
        activeTab={activeTab}
        onChange={setTab}
        layoutId="statsTab"
        action={
          activeTab !== 'dominantalar' && activeTab !== 'reyting' ? (
            <ArchiveFilterButton onClick={() => setFilterOpen(true)} isActive={filterOpen} />
          ) : undefined
        }
      />

      <ArchiveFilterModal
        open={filterOpen}
        value={dateFilter}
        onChange={setDateFilter}
        onClose={() => setFilterOpen(false)}
      />

      {activeTab !== 'reyting' && (
      <div className="mb-5 flex flex-wrap gap-2">
        {activeTab === 'dominantalar' ? (
          <>
            <StatChip label="Jami" value={summary.completed} tone="violet" />
            <StatChip label="Dominantalar" value={dominants.length} tone="neutral" />
            <StatChip
              label="O'rtacha"
              value={dominants.length > 0 ? summary.rate : 0}
              tone="violet"
            />
          </>
        ) : (
          <>
            <StatChip label="Foiz" value={`${summary.rate}%`} tone={accentTone} />
            <StatChip
              label={activeTab === 'indikatorlar' ? 'Kiritilgan' : 'Bajarilgan'}
              value={summary.completed}
              tone={accentTone}
            />
            {activeTab === 'indikatorlar' && summary.skipped > 0 && (
              <StatChip label="O'tkazilgan" value={summary.skipped} tone="neutral" />
            )}
            <StatChip
              label={activeTab === 'indikatorlar' ? 'Kiritilmagan' : 'Bajarilmagan'}
              value={summary.missed}
              tone="red"
            />
            <StatChip label="Kunlar" value={summary.dayCount} tone="neutral" />
          </>
        )}
      </div>
      )}

      <AnimatePresence mode="wait">
        {activeTab === 'reyting' && (
          <motion.div
            key="reyting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <h2 className="mb-3 text-lg font-bold">Klub Reytingi</h2>
            <LeaderboardPanel
              leaderboard={userData.leaderboard}
              currentUserName={userData.name}
            />
          </motion.div>
        )}

        {activeTab === 'amaliyotlar' && (
          <motion.div
            key="amaliyotlar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <ActivityChart
              title="Amaliyotlar grafigi"
              subtitle="Tanlangan davr bo'yicha kunlik bajarilganlar"
              bars={getHabitDailyBars(practices, history, dateFilter, 'practice')}
              accent={chartAccent}
              emptyLabel="Tanlangan davrda amaliyot yo'q"
            />
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-300">Jadval</h3>
              <StatsTable
                rows={getHabitStatRows(practices, history, dateFilter, 'practice')}
                variant="practice"
                emptyLabel="Amaliyotlar mavjud emas"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'indikatorlar' && (
          <motion.div
            key="indikatorlar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <ActivityChart
              title="Indikatorlar grafigi"
              subtitle="Tanlangan davr bo'yicha kunlik kiritilganlar"
              bars={getHabitDailyBars(indicators, history, dateFilter, 'indicator')}
              accent={chartAccent}
              emptyLabel="Tanlangan davrda indikator yo'q"
            />
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-300">Jadval</h3>
              <StatsTable
                rows={getHabitStatRows(indicators, history, dateFilter, 'indicator')}
                variant="indicator"
                emptyLabel="Indikatorlar mavjud emas"
              />
            </div>
          </motion.div>
        )}

        {activeTab === 'dominantalar' && (
          <motion.div
            key="dominantalar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            <ActivityChart
              title="Dominantalar grafigi"
              subtitle="Har bir dominanta bo'yicha yakunlangan sessiyalar"
              bars={getDominantBars(dominants)}
              accent={chartAccent}
              emptyLabel="Dominantalar mavjud emas"
            />
            <div>
              <h3 className="mb-3 text-sm font-bold text-slate-300">Jadval</h3>
              <StatsTable
                rows={getDominantStatRows(dominants)}
                variant="dominant"
                emptyLabel="Dominantalar mavjud emas"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

export default function Statistics() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="h-40 animate-pulse rounded-xl bg-slate-800/50" />
        </PageContainer>
      }
    >
      <StatisticsContent />
    </Suspense>
  );
}
