'use client';

import { useEffect, useRef } from 'react';
import { useTelegramWebApp } from '@/components/TelegramWebAppProvider';
import { useUserData } from '@/components/UserDataProvider';
import { dedupeHabits, dedupeHistory } from '@/lib/data';
import { getPractices } from '@/lib/indicators';
import { fetchIndicatorHistory, fetchIndicators } from '@/lib/indicatorsApi';
import { fetchPracticeHistory, fetchPractices, hasTelegramSession } from '@/lib/practicesApi';
import { fetchDominants } from '@/lib/dominantsApi';
import { fetchLeaderboard } from '@/lib/leaderboardApi';
import { profileDisplayName } from '@/lib/xp';

export default function HabitsSync() {
  const { loading: tgLoading, profile } = useTelegramWebApp();
  const { userData, updateUserData, syncServerProgress } = useUserData();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (tgLoading || !profile || !userData || syncedRef.current) return;
    if (!hasTelegramSession()) return;

    syncedRef.current = true;

    (async () => {
      try {
        console.log('[HabitsSync] Backenddan amaliyot, indikator va dominantalar yuklanmoqda...');
        const [practices, indicators, practiceHistory, indicatorHistory, dominants, leaderboard] =
          await Promise.all([
            fetchPractices(),
            fetchIndicators(),
            fetchPracticeHistory(),
            fetchIndicatorHistory(),
            fetchDominants(),
            fetchLeaderboard(20),
          ]);

        updateUserData({
          goodHabits: dedupeHabits([...practices, ...indicators]),
          habitHistory: dedupeHistory([...practiceHistory, ...indicatorHistory]),
          dominants,
        });

        if (profile) {
          syncServerProgress({
            xp: profile.xp ?? 0,
            level: profile.level ?? 1,
            nextLevelXp: profile.level_up_xp ?? userData.nextLevelXp,
            name: profileDisplayName(profile),
            leaderboard: leaderboard.data,
            currentUserRank: leaderboard.current_user_rank,
          });
        }
        console.log('[HabitsSync] Backend bilan sinxronlandi', {
          practices: practices.length,
          indicators: indicators.length,
          practiceHistory: practiceHistory.length,
          indicatorHistory: indicatorHistory.length,
          dominants: dominants.length,
          localPracticesBefore: getPractices(userData.goodHabits).length,
        });
      } catch (error) {
        console.error('[HabitsSync] Sinxronlash xatosi', error);
        syncedRef.current = false;
      }
    })();
  }, [tgLoading, profile, userData, updateUserData, syncServerProgress]);

  return null;
}
