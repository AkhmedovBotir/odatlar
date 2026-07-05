import { Suspense } from 'react';
import { UserDataProvider } from '@/components/UserDataProvider';
import { NotificationProvider } from '@/components/NotificationProvider';
import { NavigationProvider } from '@/components/NavigationProvider';
import AppShell from '@/components/AppShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserDataProvider>
      <NotificationProvider>
        <Suspense fallback={null}>
          <NavigationProvider>
            <AppShell>{children}</AppShell>
          </NavigationProvider>
        </Suspense>
      </NotificationProvider>
    </UserDataProvider>
  );
}
