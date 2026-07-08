import { Suspense } from 'react';
import { UserDataProvider } from '@/components/UserDataProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { NavigationProvider } from '@/components/NavigationProvider';
import { TelegramWebAppProvider } from '@/components/TelegramWebAppProvider';
import HabitsSync from '@/components/HabitsSync';
import AppShell from '@/components/AppShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramWebAppProvider>
      <UserDataProvider>
        <HabitsSync />
        <NotificationProvider>
          <Suspense fallback={null}>
            <NavigationProvider>
              <AppShell>{children}</AppShell>
            </NavigationProvider>
          </Suspense>
        </NotificationProvider>
      </UserDataProvider>
    </TelegramWebAppProvider>
  );
}
