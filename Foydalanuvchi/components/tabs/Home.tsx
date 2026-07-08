'use client';

import { useCallback } from 'react';
import { useUserData } from '@/components/UserDataProvider';
import PageContainer from '@/components/PageContainer';
import HomeHero from '@/components/home/HomeHero';
import HomeQuickActions from '@/components/home/HomeQuickActions';
import HomeTodayList from '@/components/home/HomeTodayList';
import HomeDominantTeaser from '@/components/home/HomeDominantTeaser';
import HomeLeaderboard from '@/components/home/HomeLeaderboard';
import { getPractices } from '@/lib/indicators';
import { addHistoryEntry, removeTodayHistoryEntry } from '@/lib/habits';
import { hasTelegramSession, togglePractice } from '@/lib/practicesApi';
import { hasServerXPAward } from '@/lib/xp';
import type { GoodHabit } from '@/lib/types';

export default function Home() {
  const { userData, updateWithRewards, applyServerXPReward, addReward } = useUserData();

  const handleToggle = useCallback(
    async (habit: GoodHabit) => {
      if (!userData) return;

      const history = userData.habitHistory ?? [];
      const completing = !habit.completedToday;

      if (hasTelegramSession()) {
        try {
          const updated = await togglePractice(habit.id);
          const updatedHabits = userData.goodHabits.map((h) =>
            h.id === habit.id ? { ...h, ...updated, kind: 'practice' as const } : h
          );
          const updatedHistory = updated.completedToday
            ? addHistoryEntry(history, { ...habit, ...updated })
            : removeTodayHistoryEntry(history, habit.id);

          if (hasServerXPAward(updated)) {
            applyServerXPReward(updated, {
              goodHabits: updatedHabits,
              habitHistory: updatedHistory,
            });
            if (updated.xp_reward) addReward(updated.xp_reward, 'xp');
          }
        } catch (error) {
          console.error('[Home] togglePractice xatosi', error);
        }
        return;
      }

      const xpReward = completing ? 50 : -25;

      const updatedHabits = userData.goodHabits.map((h) =>
        h.id === habit.id
          ? {
              ...h,
              completedToday: !h.completedToday,
              streak: completing ? h.streak + 1 : Math.max(0, h.streak - 1),
            }
          : h
      );

      const updatedHistory = completing
        ? addHistoryEntry(history, habit)
        : removeTodayHistoryEntry(history, habit.id);

      updateWithRewards({ goodHabits: updatedHabits, habitHistory: updatedHistory }, xpReward);
      addReward(xpReward, 'xp');
    },
    [userData, updateWithRewards, applyServerXPReward, addReward]
  );

  if (!userData) return null;

  const practices = getPractices(userData.goodHabits);
  const completedToday = practices.filter((h) => h.completedToday).length;

  return (
    <PageContainer>
      <HomeHero
        userData={userData}
        completedToday={completedToday}
        totalPractices={practices.length}
      />

      <HomeQuickActions />

      <HomeTodayList practices={practices} onToggle={handleToggle} />

      <HomeDominantTeaser dominants={userData.dominants} />

      <HomeLeaderboard entries={userData.leaderboard} userName={userData.name} />
    </PageContainer>
  );
}
