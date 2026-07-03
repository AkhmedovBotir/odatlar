'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  CheckCircle2,
  BarChart3,
  Archive,
} from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import ConfirmModal from '@/components/ConfirmModal';
import PageContainer from '@/components/PageContainer';
import HabitTabNav from '@/components/habits/HabitTabNav';
import ArchivePanel from '@/components/habits/ArchivePanel';
import IndicatorRow from '@/components/habits/IndicatorRow';
import PracticeCard from '@/components/habits/PracticeCard';
import HabitDayHero from '@/components/habits/HabitDayHero';
import type { GoodHabit } from '@/lib/types';
import {
  getPractices,
  getIndicators,
  getIndicatorStatusLabel,
  isIndicatorLoggedToday,
  addIndicatorHistoryEntry,
} from '@/lib/indicators';
import {
  addHistoryEntry,
  removeTodayHistoryEntry,
  buildArchiveDays,
  parseArchiveDateFilter,
  serializeArchiveDateFilter,
  type ArchiveDateFilter,
} from '@/lib/habits';

type HabitTab = 'amaliyotlar' | 'indikatorlar' | 'arxiv';
type ArchiveKind = 'amaliyotlar' | 'indikatorlar';

const tabs: { id: HabitTab; label: string; shortLabel: string; icon: typeof CheckCircle2 }[] = [
  { id: 'amaliyotlar', label: 'Amaliyotlar', shortLabel: 'Amal.', icon: CheckCircle2 },
  { id: 'indikatorlar', label: 'Indikatorlar', shortLabel: 'Indik.', icon: BarChart3 },
  { id: 'arxiv', label: 'Arxiv', shortLabel: 'Arxiv', icon: Archive },
];

function parseArchiveKind(value: string | null): ArchiveKind {
  return value === 'indikatorlar' ? 'indikatorlar' : 'amaliyotlar';
}

function GoodHabitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, updateUserData, updateWithRewards, addReward, showHabitModal, setShowHabitModal } =
    useUserData();

  const activeTab = (searchParams.get('tab') as HabitTab) || 'amaliyotlar';
  const archiveKind = parseArchiveKind(searchParams.get('arxiv'));
  const [editingHabit, setEditingHabit] = useState<GoodHabit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodHabit | null>(null);
  const [modalKind, setModalKind] = useState<'practice' | 'indicator'>('practice');
  const [formData, setFormData] = useState({ name: '', benefits: [''] });

  if (!userData) return null;

  const history = userData.habitHistory ?? [];
  const dateFilter = parseArchiveDateFilter(searchParams.get('davr'), history);
  const davrParam = serializeArchiveDateFilter(dateFilter);
  const practices = getPractices(userData.goodHabits);
  const indicators = getIndicators(userData.goodHabits);
  const totalPractices = practices.length;
  const completedToday = practices.filter((h) => h.completedToday).length;
  const loggedIndicators = indicators.filter((h) => isIndicatorLoggedToday(h, history)).length;

  const setTab = (tab: HabitTab) => {
    if (tab === 'amaliyotlar') {
      router.replace('/odatlar', { scroll: false });
      return;
    }
    if (tab === 'arxiv') {
      router.replace(`/odatlar?tab=arxiv&davr=${davrParam}&arxiv=${archiveKind}`, { scroll: false });
      return;
    }
    router.replace(`/odatlar?tab=${tab}&davr=${davrParam}`, { scroll: false });
  };

  const setDateFilter = (next: ArchiveDateFilter) => {
    const arxivPart = activeTab === 'arxiv' ? `&arxiv=${archiveKind}` : '';
    router.replace(
      `/odatlar?tab=${activeTab}&davr=${serializeArchiveDateFilter(next)}${arxivPart}`,
      { scroll: false }
    );
  };

  const setArchiveKind = (kind: ArchiveKind) => {
    router.replace(`/odatlar?tab=arxiv&davr=${davrParam}&arxiv=${kind}`, { scroll: false });
  };

  const archiveHabits = archiveKind === 'indikatorlar' ? indicators : practices;
  const archiveKindFilter = archiveKind === 'indikatorlar' ? 'indicator' : 'practice';
  const archiveDays = buildArchiveDays(
    archiveHabits,
    history,
    dateFilter,
    archiveKindFilter
  );
  const archiveCompletedCount = archiveDays
    .flatMap((day) => day.items)
    .filter((item) => item.status === 'completed').length;
  const archiveMissedCount = archiveDays
    .flatMap((day) => day.items)
    .filter((item) => item.status === 'missed').length;

  const handleHabitToggle = (habitId: string) => {
    const habit = practices.find((h) => h.id === habitId);
    if (!habit) return;

    const completing = !habit.completedToday;
    const xpReward = completing ? 50 : -25;

    const updatedHabits = userData.goodHabits.map((h) =>
      h.id === habitId
        ? {
            ...h,
            completedToday: !h.completedToday,
            streak: completing ? h.streak + 1 : Math.max(0, h.streak - 1),
          }
        : h
    );

    const updatedHistory = completing
      ? addHistoryEntry(history, habit)
      : removeTodayHistoryEntry(history, habitId);

    updateWithRewards({ goodHabits: updatedHabits, habitHistory: updatedHistory }, xpReward);
    addReward(xpReward, 'xp');
  };

  const openEditModal = (habit?: GoodHabit, kind: 'practice' | 'indicator' = 'practice') => {
    if (habit) {
      setEditingHabit(habit);
      setModalKind(habit.kind === 'indicator' ? 'indicator' : 'practice');
      setFormData({
        name: habit.name,
        benefits: habit.benefits?.length ? habit.benefits : [''],
      });
    } else {
      setEditingHabit(null);
      setModalKind(kind);
      setFormData({ name: '', benefits: [''] });
    }
    setShowHabitModal(true);
  };

  const handleIndicatorSave = (
    habitId: string,
    value: string,
    label: string,
    isEmpty: boolean
  ) => {
    const habit = indicators.find((h) => h.id === habitId);
    if (!habit) return;

    const hadEntry = isIndicatorLoggedToday(habit, history);
    const updatedHabits = userData.goodHabits.map((h) =>
      h.id === habitId ? { ...h, todayIndicatorValue: value } : h
    );
    const updatedHistory = addIndicatorHistoryEntry(history, habit, value, label, isEmpty);

    if (!hadEntry) {
      const xpReward = isEmpty ? 10 : 25;
      updateWithRewards(
        { goodHabits: updatedHabits, habitHistory: updatedHistory },
        xpReward
      );
      addReward(xpReward, 'xp');
      return;
    }

    updateUserData({ goodHabits: updatedHabits, habitHistory: updatedHistory });
  };

  const saveHabit = () => {
    if (!formData.name.trim()) return;
    const benefits = formData.benefits.filter((b) => b.trim());

    if (editingHabit) {
      const updated = userData.goodHabits.map((h) =>
        h.id === editingHabit.id
          ? {
              ...h,
              name: formData.name,
              benefits,
            }
          : h
      );
      const updatedHistory = history.map((entry) =>
        entry.habitId === editingHabit.id ? { ...entry, habitName: formData.name } : entry
      );
      updateUserData({ goodHabits: updated, habitHistory: updatedHistory });
    } else if (modalKind === 'indicator') {
      const newHabit: GoodHabit = {
        id: `ind_${Date.now()}`,
        name: formData.name.trim(),
        benefits,
        kind: 'indicator',
        completedToday: false,
        streak: 0,
        todayIndicatorValue: null,
      };
      updateUserData({ goodHabits: [...userData.goodHabits, newHabit] });
    } else {
      const newHabit: GoodHabit = {
        id: Date.now().toString(),
        name: formData.name,
        benefits,
        kind: 'practice',
        completedToday: false,
        streak: 0,
      };
      updateUserData({ goodHabits: [...userData.goodHabits, newHabit] });
    }

    setShowHabitModal(false);
    setEditingHabit(null);
    setFormData({ name: '', benefits: [''] });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    updateUserData({
      goodHabits: userData.goodHabits.filter((h) => h.id !== deleteTarget.id),
      habitHistory: history.filter((entry) => entry.habitId !== deleteTarget.id),
    });
    setDeleteTarget(null);
  };

  const pendingHabits = practices.filter((h) => !h.completedToday);
  const doneHabits = practices.filter((h) => h.completedToday);
  const pendingIndicators = indicators.filter((h) => !isIndicatorLoggedToday(h, history));
  const loggedIndicatorList = indicators.filter((h) => isIndicatorLoggedToday(h, history));

  return (
    <PageContainer className="relative">
      <HabitTabNav tabs={tabs} activeTab={activeTab} onChange={setTab} />

      <AnimatePresence mode="wait">
        {activeTab === 'amaliyotlar' && (
          <motion.div
            key="amaliyotlar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <HabitDayHero
              variant="practice"
              completed={completedToday}
              total={totalPractices}
              habits={userData.goodHabits}
              history={history}
            />

            {totalPractices === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 px-6 py-14 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                <p className="font-medium text-slate-300">Hali amaliyotlar yo&apos;q</p>
                <p className="mt-1 text-sm text-slate-500">
                  Birinchi odatni qo&apos;shib, kundalik streykni boshlang
                </p>
                <button
                  onClick={() => openEditModal()}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Amaliyot qo&apos;shish
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingHabits.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Qolgan ({pendingHabits.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingHabits.map((habit) => (
                        <PracticeCard
                          key={habit.id}
                          habit={habit}
                          onToggle={() => handleHabitToggle(habit.id)}
                          onEdit={() => openEditModal(habit)}
                          onDelete={() => setDeleteTarget(habit)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {doneHabits.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-500/80">
                      Bajarilgan ({doneHabits.length})
                    </h3>
                    <div className="space-y-3">
                      {doneHabits.map((habit) => (
                        <PracticeCard
                          key={habit.id}
                          habit={habit}
                          onToggle={() => handleHabitToggle(habit.id)}
                          onEdit={() => openEditModal(habit)}
                          onDelete={() => setDeleteTarget(habit)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'indikatorlar' && (
          <motion.div
            key="indikatorlar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <HabitDayHero
              variant="indicator"
              completed={loggedIndicators}
              total={indicators.length}
              habits={userData.goodHabits}
              history={history}
            />

            {indicators.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 px-6 py-14 text-center">
                <BarChart3 className="mx-auto mb-3 h-12 w-12 text-slate-600" />
                <p className="font-medium text-slate-300">Hali indikatorlar yo&apos;q</p>
                <p className="mt-1 text-sm text-slate-500">
                  Uyqu, kitob o&apos;qish kabi kundalik qiymatlarni kuzating
                </p>
                <button
                  onClick={() => openEditModal(undefined, 'indicator')}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-5 py-2.5 text-sm font-semibold"
                >
                  <Plus className="h-4 w-4" />
                  Indikator qo&apos;shish
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingIndicators.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Kiritilmagan ({pendingIndicators.length})
                    </h3>
                    <div className="space-y-3">
                      {pendingIndicators.map((habit) => (
                        <IndicatorRow
                          key={habit.id}
                          habit={habit}
                          history={history}
                          statusLabel={getIndicatorStatusLabel(habit, history)}
                          onSave={(value, label, isEmpty) =>
                            handleIndicatorSave(habit.id, value, label, isEmpty)
                          }
                          onEdit={() => openEditModal(habit, 'indicator')}
                          onDelete={() => setDeleteTarget(habit)}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {loggedIndicatorList.length > 0 && (
                  <section>
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-cyan-500/80">
                      Kiritilgan ({loggedIndicatorList.length})
                    </h3>
                    <div className="space-y-3">
                      {loggedIndicatorList.map((habit) => (
                        <IndicatorRow
                          key={habit.id}
                          habit={habit}
                          history={history}
                          statusLabel={getIndicatorStatusLabel(habit, history)}
                          onSave={(value, label, isEmpty) =>
                            handleIndicatorSave(habit.id, value, label, isEmpty)
                          }
                          onEdit={() => openEditModal(habit, 'indicator')}
                          onDelete={() => setDeleteTarget(habit)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── ARXIV ── */}
        {activeTab === 'arxiv' && (
          <motion.div
            key="arxiv"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ArchivePanel
              dateFilter={dateFilter}
              archiveKind={archiveKind}
              archiveDays={archiveDays}
              completedCount={archiveCompletedCount}
              missedCount={archiveMissedCount}
              hasHabits={archiveHabits.length > 0}
              onDateFilterChange={setDateFilter}
              onArchiveKindChange={setArchiveKind}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {(activeTab === 'amaliyotlar' || activeTab === 'indikatorlar') && (
        <motion.button
          onClick={() =>
            openEditModal(undefined, activeTab === 'indikatorlar' ? 'indicator' : 'practice')
          }
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white shadow-xl shadow-blue-900/50 lg:bottom-8"
          aria-label={activeTab === 'indikatorlar' ? "Indikator qo'shish" : "Amaliyot qo'shish"}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showHabitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50"
            onClick={() => setShowHabitModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-t-2xl sm:rounded-lg p-6 max-w-md w-full border border-slate-600 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingHabit
                    ? modalKind === 'indicator'
                      ? 'Indikatorni tahrirlash'
                      : 'Amaliyotni tahrirlash'
                    : modalKind === 'indicator'
                      ? "Yangi indikator qo'shish"
                      : "Yangi amaliyot qo'shish"}
                </h2>
                <button
                  onClick={() => setShowHabitModal(false)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nomi</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={
                      modalKind === 'indicator' ? "Masalan: Kitob o'qish" : 'Masalan: Erta turish'
                    }
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Foydalari</label>
                  <div className="space-y-2">
                    {formData.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...formData.benefits];
                            newBenefits[idx] = e.target.value;
                            setFormData({ ...formData, benefits: newBenefits });
                          }}
                          placeholder="Foydasini yozing..."
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        {formData.benefits.length > 1 && (
                          <button
                            onClick={() =>
                              setFormData({
                                ...formData,
                                benefits: formData.benefits.filter((_, i) => i !== idx),
                              })
                            }
                            className="p-2 hover:bg-slate-700 rounded text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, benefits: [...formData.benefits, ''] })}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Foyda qo&apos;sh
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveHabit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg py-2 font-semibold transition-all"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={() => setShowHabitModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg py-2 font-semibold transition-all"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!deleteTarget}
        title={deleteTarget?.kind === 'indicator' ? "Indikatorni o'chirish" : "Amaliyotni o'chirish"}
        message={`"${deleteTarget?.name}" ${
          deleteTarget?.kind === 'indicator' ? 'indikatorini' : 'amaliyotini'
        } o'chirmoqchimisiz? Arxivdagi yozuvlar ham o'chadi.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}

export default function GoodHabits() {
  return (
    <Suspense>
      <GoodHabitsContent />
    </Suspense>
  );
}
