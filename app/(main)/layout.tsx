import { UserDataProvider } from '@/components/UserDataProvider';
import AppShell from '@/components/AppShell';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <UserDataProvider>
      <AppShell>{children}</AppShell>
    </UserDataProvider>
  );
}
