'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { dedupeUserData, loadUserData, saveUserData } from '@/lib/data';
import { applyGamification } from '@/lib/gamification';
import type { ServerXPAward } from '@/lib/xp';
import type { LeaderboardEntry, UserData } from '@/lib/types';

interface Reward {
  id: number;
  amount: number;
  type: string;
}

interface UserDataContextValue {
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  rewards: Reward[];
  showHabitModal: boolean;
  setShowHabitModal: (show: boolean) => void;
  updateUserData: (updates: Partial<UserData>) => void;
  applyRewards: (xpDelta: number, coinsDelta?: number) => void;
  updateWithRewards: (updates: Partial<UserData>, xpDelta: number, coinsDelta?: number) => void;
  applyServerXPReward: (award: ServerXPAward, updates?: Partial<UserData>) => void;
  syncServerProgress: (payload: {
    xp: number;
    level: number;
    nextLevelXp: number;
    name?: string;
    leaderboard?: LeaderboardEntry[];
    currentUserRank?: number;
  }) => void;
  addReward: (amount: number, type?: string) => void;
  retryLoad: () => void;
}

const UserDataContext = createContext<UserDataContextValue | null>(null);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [showHabitModal, setShowHabitModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = dedupeUserData(await loadUserData());
      setUserData(data);
      saveUserData(data);
    } catch {
      setError('Ma\'lumotlarni yuklab bo\'lmadi. Internetni tekshirib qayta urinib ko\'ring.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateUserData = useCallback((updates: Partial<UserData>) => {
    setUserData((prev) => {
      if (!prev) return prev;
      const next = dedupeUserData({ ...prev, ...updates });
      saveUserData(next);
      return next;
    });
  }, []);

  const applyRewards = useCallback((xpDelta: number, coinsDelta = 0) => {
    setUserData((prev) => {
      if (!prev) return prev;
      const next = dedupeUserData(applyGamification(prev, { xpDelta, coinsDelta }));
      saveUserData(next);
      return next;
    });
  }, []);

  const updateWithRewards = useCallback(
    (updates: Partial<UserData>, xpDelta: number, coinsDelta = 0) => {
      setUserData((prev) => {
        if (!prev) return prev;
        const merged = { ...prev, ...updates };
        const next = dedupeUserData(applyGamification(merged, { xpDelta, coinsDelta }));
        saveUserData(next);
        return next;
      });
    },
    []
  );

  const applyServerXPReward = useCallback((award: ServerXPAward, updates?: Partial<UserData>) => {
    setUserData((prev) => {
      if (!prev) return prev;
      const merged: UserData = {
        ...prev,
        ...updates,
        serverSynced: true,
      };
      if (award.xp !== undefined) merged.xp = award.xp;
      if (award.level !== undefined) merged.level = award.level;
      const next = dedupeUserData(merged);
      saveUserData(next);
      return next;
    });
  }, []);

  const syncServerProgress = useCallback(
    (payload: {
      xp: number;
      level: number;
      nextLevelXp: number;
      name?: string;
      leaderboard?: LeaderboardEntry[];
      currentUserRank?: number;
    }) => {
      setUserData((prev) => {
        if (!prev) return prev;
        const next = dedupeUserData({
          ...prev,
          name: payload.name ?? prev.name,
          xp: payload.xp,
          level: payload.level,
          nextLevelXp: payload.nextLevelXp,
          leaderboard: payload.leaderboard ?? prev.leaderboard,
          currentUserRank: payload.currentUserRank ?? prev.currentUserRank,
          serverSynced: true,
        });
        saveUserData(next);
        return next;
      });
    },
    []
  );

  const addReward = useCallback((amount: number, type = 'xp') => {
    const id = Date.now();
    setRewards((prev) => [...prev, { id, amount, type }]);
    setTimeout(() => {
      setRewards((prev) => prev.filter((r) => r.id !== id));
    }, 1500);
  }, []);

  return (
    <UserDataContext.Provider
      value={{
        userData,
        loading,
        error,
        rewards,
        showHabitModal,
        setShowHabitModal,
        updateUserData,
        applyRewards,
        updateWithRewards,
        applyServerXPReward,
        syncServerProgress,
        addReward,
        retryLoad: fetchData,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be used within UserDataProvider');
  return ctx;
}
