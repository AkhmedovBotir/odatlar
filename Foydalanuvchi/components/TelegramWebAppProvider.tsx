'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  BotUserProfile,
  TelegramUnsafeUser,
  initializeTelegramWebAppProfile,
} from '@/lib/telegramWebApp';

interface TelegramWebAppContextValue {
  loading: boolean;
  telegramUser: TelegramUnsafeUser | null;
  profile: BotUserProfile | null;
}

const TelegramWebAppContext = createContext<TelegramWebAppContextValue>({
  loading: true,
  telegramUser: null,
  profile: null,
});

export function TelegramWebAppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [telegramUser, setTelegramUser] = useState<TelegramUnsafeUser | null>(null);
  const [profile, setProfile] = useState<BotUserProfile | null>(null);

  useEffect(() => {
    let active = true;

    initializeTelegramWebAppProfile()
      .then((result) => {
        if (!active) return;
        setTelegramUser(result.telegramUser);
        setProfile(result.profile);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <TelegramWebAppContext.Provider value={{ loading, telegramUser, profile }}>
      {children}
    </TelegramWebAppContext.Provider>
  );
}

export function useTelegramWebApp() {
  return useContext(TelegramWebAppContext);
}
