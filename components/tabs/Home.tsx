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
import type { GoodHabit } from '@/lib/types';

export default function Home() {
  const { userData, updateUserData, updateWithRewards, addReward } = useUserData();

  const handleToggle = useCallback(
    (habit: GoodHabit) => {
      if (!userData) return;

      const history = userData.habitHistory ?? [];
      const completing = !habit.completedToday;
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
    [userData, updateWithRewards, addReward]
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
