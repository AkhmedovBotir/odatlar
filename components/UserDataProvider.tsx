'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { loadUserData, saveUserData } from '@/lib/data';
import { applyGamification } from '@/lib/gamification';
import type { UserData } from '@/lib/types';

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
      const data = await loadUserData();
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
      const next = { ...prev, ...updates };
      saveUserData(next);
      return next;
    });
  }, []);

  const applyRewards = useCallback((xpDelta: number, coinsDelta = 0) => {
    setUserData((prev) => {
      if (!prev) return prev;
      const next = applyGamification(prev, { xpDelta, coinsDelta });
      saveUserData(next);
      return next;
    });
  }, []);

  const updateWithRewards = useCallback(
    (updates: Partial<UserData>, xpDelta: number, coinsDelta = 0) => {
      setUserData((prev) => {
        if (!prev) return prev;
        const merged = { ...prev, ...updates };
        const next = applyGamification(merged, { xpDelta, coinsDelta });
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
