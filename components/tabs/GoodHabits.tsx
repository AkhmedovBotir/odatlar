'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  X,
  Flame,
  BarChart3,
  Archive,
  Calendar,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import ConfirmModal from '@/components/ConfirmModal';
import PageContainer from '@/components/PageContainer';
import PeriodFilter from '@/components/habits/PeriodFilter';
import type { GoodHabit } from '@/lib/types';
import {
  addHistoryEntry,
  removeTodayHistoryEntry,
  getHabitCompletionCountInPeriod,
  getLastCompletedEntry,
  getHabitPeriodRate,
  getOverallPeriodRate,
  filterHistoryByPeriod,
  getPeriodLabel,
  buildArchiveDays,
  formatArchiveDate,
  formatDateTime,
  formatDateTimeCompact,
  todayKey,
  PERIOD_OPTIONS,
  type HistoryPeriod,
} from '@/lib/habits';

function parsePeriod(value: string | null): HistoryPeriod {
  if (value && PERIOD_OPTIONS.some((p) => p.id === value)) {
    return value as HistoryPeriod;
  }
  return '7d';
}

type HabitTab = 'amaliyotlar' | 'indikatorlar' | 'arxiv';

const tabs: { id: HabitTab; label: string; shortLabel: string; icon: typeof CheckCircle2 }[] = [
  { id: 'amaliyotlar', label: 'Amaliyotlar', shortLabel: 'Amal.', icon: CheckCircle2 },
  { id: 'indikatorlar', label: 'Indikatorlar', shortLabel: 'Indik.', icon: BarChart3 },
  { id: 'arxiv', label: 'Arxiv', shortLabel: 'Arxiv', icon: Archive },
];

function GoodHabitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, updateUserData, updateWithRewards, addReward, showHabitModal, setShowHabitModal } =
    useUserData();

  const activeTab = (searchParams.get('tab') as HabitTab) || 'amaliyotlar';
  const period = parsePeriod(searchParams.get('davr'));
  const [editingHabit, setEditingHabit] = useState<GoodHabit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GoodHabit | null>(null);
  const [formData, setFormData] = useState({ name: '', benefits: [''] });

  if (!userData) return null;

  const history = userData.habitHistory ?? [];
  const totalHabits = userData.goodHabits.length;
  const completedToday = userData.goodHabits.filter((h) => h.completedToday).length;
  const progressPercent = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  const setTab = (tab: HabitTab) => {
    if (tab === 'amaliyotlar') {
      router.replace('/odatlar', { scroll: false });
      return;
    }
    router.replace(`/odatlar?tab=${tab}&davr=${period}`, { scroll: false });
  };

  const setPeriod = (next: HistoryPeriod) => {
    router.replace(`/odatlar?tab=${activeTab}&davr=${next}`, { scroll: false });
  };

  const filteredHistory = filterHistoryByPeriod(history, period);
  const archiveDays = buildArchiveDays(userData.goodHabits, history, period);
  const archiveCompletedCount = archiveDays
    .flatMap((day) => day.items)
    .filter((item) => item.status === 'completed').length;
  const archiveMissedCount = archiveDays
    .flatMap((day) => day.items)
    .filter((item) => item.status === 'missed').length;
  const periodLabel = getPeriodLabel(period);

  const handleHabitToggle = (habitId: string) => {
    const habit = userData.goodHabits.find((h) => h.id === habitId);
    if (!habit) return;

    const completing = !habit.completedToday;
    const xpReward = completing ? 50 : -25;
    const coinsReward = completing ? 5 : 0;

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

    updateWithRewards({ goodHabits: updatedHabits, habitHistory: updatedHistory }, xpReward, coinsReward);
    addReward(xpReward, 'xp');
  };

  const openEditModal = (habit?: GoodHabit) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({ name: habit.name, benefits: habit.benefits?.length ? habit.benefits : [''] });
    } else {
      setEditingHabit(null);
      setFormData({ name: '', benefits: [''] });
    }
    setShowHabitModal(true);
  };

  const saveHabit = () => {
    if (!formData.name.trim()) return;
    const benefits = formData.benefits.filter((b) => b.trim());

    if (editingHabit) {
      const updated = userData.goodHabits.map((h) =>
        h.id === editingHabit.id ? { ...h, name: formData.name, benefits } : h
      );
      const updatedHistory = history.map((entry) =>
        entry.habitId === editingHabit.id ? { ...entry, habitName: formData.name } : entry
      );
      updateUserData({ goodHabits: updated, habitHistory: updatedHistory });
    } else {
      const newHabit: GoodHabit = {
        id: Date.now().toString(),
        name: formData.name,
        benefits,
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

  const pendingHabits = userData.goodHabits.filter((h) => !h.completedToday);
  const doneHabits = userData.goodHabits.filter((h) => h.completedToday);

  return (
    <PageContainer>
      {/* Tab navigation */}
      <div className="flex gap-1 p-1 mb-6 bg-slate-800/80 rounded-xl border border-slate-700 lg:max-w-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`relative flex-1 flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1.5 sm:px-2 rounded-lg text-xs md:text-sm font-semibold transition-all min-w-0 ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="habitTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-purple-600/80 rounded-lg border border-blue-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10 flex-shrink-0" />
              <span className="relative z-10 hidden min-[400px]:inline truncate">{tab.label}</span>
              <span className="relative z-10 min-[400px]:hidden truncate">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── AMALIYOTLAR (checklist) ── */}
        {activeTab === 'amaliyotlar' && (
          <motion.div
            key="amaliyotlar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 md:p-5 border border-slate-600 mb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-3">
                <div>
                  <p className="text-sm text-slate-400">Bugungi progress</p>
                  <p className="text-2xl font-bold">
                    {completedToday}
                    <span className="text-slate-500 text-lg"> / {totalHabits}</span>
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-3xl font-bold text-green-400">{progressPercent}%</p>
                  <p className="text-xs text-slate-400">bajarildi</p>
                </div>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                />
              </div>
            </div>

            <motion.button
              onClick={() => openEditModal()}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl p-3 font-semibold mb-5 flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-5 h-5" />
              Yangi amaliyot qo&apos;shish
            </motion.button>

            {totalHabits === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Hali amaliyotlar yo&apos;q. Birinchisini qo&apos;shing!</p>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-xl border border-slate-600 overflow-hidden">
                {pendingHabits.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-700">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Bajarilmagan ({pendingHabits.length})
                      </p>
                    </div>
                    {pendingHabits.map((habit) => (
                      <ChecklistRow
                        key={habit.id}
                        habit={habit}
                        onToggle={() => handleHabitToggle(habit.id)}
                        onEdit={() => openEditModal(habit)}
                        onDelete={() => setDeleteTarget(habit)}
                      />
                    ))}
                  </>
                )}

                {doneHabits.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-green-900/20 border-b border-t border-slate-700">
                      <p className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                        Bajarilgan ({doneHabits.length})
                      </p>
                    </div>
                    {doneHabits.map((habit) => (
                      <ChecklistRow
                        key={habit.id}
                        habit={habit}
                        onToggle={() => handleHabitToggle(habit.id)}
                        onEdit={() => openEditModal(habit)}
                        onDelete={() => setDeleteTarget(habit)}
                      />
                    ))}
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ── INDIKATORLAR ── */}
        {activeTab === 'indikatorlar' && (
          <motion.div
            key="indikatorlar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <PeriodFilter value={period} onChange={setPeriod} />

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-xl p-4 border border-blue-500/30">
                <p className="text-xs text-blue-300 mb-1">{periodLabel} samaradorlik</p>
                <p className="text-3xl font-bold text-blue-300">
                  {getOverallPeriodRate(history, totalHabits, period)}%
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-xl p-4 border border-green-500/30">
                <p className="text-xs text-green-300 mb-1">{periodLabel} bajarilgan</p>
                <p className="text-3xl font-bold text-green-300">{filteredHistory.length}</p>
              </div>
            </div>

            <div className="space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:gap-6">
              {userData.goodHabits.map((habit, index) => {
                const periodRate = getHabitPeriodRate(history, habit.id, period);
                const doneInPeriod = getHabitCompletionCountInPeriod(history, habit.id, period);
                const lastEntry = getLastCompletedEntry(history, habit.id);

                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 border border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-white">{habit.name}</h3>
                      <span className="flex items-center gap-1 text-orange-400 text-sm flex-shrink-0">
                        <Flame className="w-4 h-4" />
                        {habit.streak}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-center">
                      <div className="bg-slate-900/40 rounded-lg p-2">
                        <p className="text-xs text-slate-400 mb-0.5">{periodLabel}</p>
                        <p className="text-lg font-bold text-blue-400">{periodRate}%</p>
                      </div>
                      <div className="bg-slate-900/40 rounded-lg p-2">
                        <p className="text-xs text-slate-400 mb-0.5">Soni</p>
                        <p className="text-lg font-bold text-green-400">{doneInPeriod}</p>
                      </div>
                      <div className="bg-slate-900/40 rounded-lg p-2 sm:col-span-1">
                        <p className="text-xs text-slate-400 mb-0.5">Oxirgi</p>
                        <p className="text-xs font-semibold text-slate-200 mt-1 leading-snug break-words">
                          {lastEntry ? (
                            <>
                              <span className="sm:hidden">
                                {formatDateTimeCompact(lastEntry.completedAt)}
                              </span>
                              <span className="hidden sm:inline">
                                {formatDateTime(lastEntry.completedAt)}
                              </span>
                            </>
                          ) : (
                            '—'
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{periodLabel} progress</span>
                        <span>{periodRate}%</span>
                      </div>
                      <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                          style={{ width: `${periodRate}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
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
            <PeriodFilter value={period} onChange={setPeriod} />

            <p className="text-xs text-slate-400 mb-4">
              {periodLabel} davrida{' '}
              <span className="text-green-300 font-semibold">{archiveCompletedCount}</span> ta
              bajarilgan,{' '}
              <span className="text-red-300 font-semibold">{archiveMissedCount}</span> ta
              bajarilmagan
            </p>

            {userData.goodHabits.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Archive className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Amaliyotlar qo&apos;shilmagan. Avval amaliyot yarating.</p>
              </div>
            ) : (
              <div className="space-y-4 xl:grid xl:grid-cols-2 xl:gap-6 xl:space-y-0">
                {archiveDays.map((group) => {
                  const completedInDay = group.items.filter(
                    (item) => item.status === 'completed'
                  ).length;
                  const missedInDay = group.items.length - completedInDay;

                  return (
                  <div
                    key={group.date}
                    className="bg-slate-800/50 rounded-xl border border-slate-600 overflow-hidden"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center px-3 sm:px-4 py-3 bg-slate-900/40 border-b border-slate-700">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <Calendar className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="font-semibold text-sm leading-snug break-words">
                          {formatArchiveDate(group.date)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 sm:text-right sm:flex-shrink-0 leading-snug">
                        <span className="text-green-300">{completedInDay}</span>
                        {' / '}
                        {group.items.length}
                        {missedInDay > 0 && (
                          <span className="block text-red-300/90">{missedInDay} bajarilmagan</span>
                        )}
                      </span>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          {item.status === 'completed' ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate ${
                                item.status === 'missed' ? 'text-slate-300' : 'text-white'
                              }`}
                            >
                              {item.habitName}
                            </p>
                            <p
                              className={`text-xs ${
                                item.status === 'completed' ? 'text-slate-400' : 'text-red-300/80'
                              }`}
                            >
                              {item.status === 'completed' ? (
                                <>
                                  <span className="sm:hidden">
                                    {formatDateTimeCompact(item.completedAt!)}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {formatDateTime(item.completedAt!)}
                                  </span>
                                </>
                              ) : item.date === todayKey() ? (
                                  'Hali bajarilmagan'
                                ) : (
                                  'Bajarilmagan'
                                )}
                            </p>
                          </div>
                          {item.status === 'completed' && (
                            <TrendingUp className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                  {editingHabit ? 'Amaliyotni tahrirlash' : "Yangi amaliyot qo'shish"}
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
                    placeholder="Masalan: Kitob o'qish"
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
        title="Amaliyotni o'chirish"
        message={`"${deleteTarget?.name}" amaliyotini o'chirmoqchimisiz? Arxivdagi yozuvlar ham o'chadi.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}

function ChecklistRow({
  habit,
  onToggle,
  onEdit,
  onDelete,
}: {
  habit: GoodHabit;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/50 last:border-b-0 transition-colors ${
        habit.completedToday ? 'bg-green-900/10' : 'hover:bg-slate-700/30'
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0"
        aria-label={habit.completedToday ? 'Bekor qilish' : 'Bajarildi deb belgilash'}
      >
        {habit.completedToday ? (
          <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500" />
        ) : (
          <Circle className="w-6 h-6 text-slate-500 hover:text-blue-400 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={`text-sm md:text-base font-medium truncate ${
            habit.completedToday ? 'line-through text-slate-500' : 'text-white'
          }`}
        >
          {habit.name}
        </p>
        {habit.streak > 0 && (
          <p className="text-xs text-orange-400/80 flex items-center gap-1 mt-0.5">
            <Flame className="w-3 h-3" />
            {habit.streak} kun streyk
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Tahrirlash"
        >
          <Edit2 className="w-4 h-4 text-blue-400" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="O'chirish"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
        </button>
      </div>
    </div>
  );
}

export default function GoodHabits() {
  return (
    <Suspense>
      <GoodHabitsContent />
    </Suspense>
  );
}
