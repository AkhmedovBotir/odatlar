'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/components/NavigationProvider';

export function useNavigate() {
  const router = useRouter();
  const { startNavigation } = useNavigation();

  const push = useCallback(
    (href: string) => {
      startNavigation();
      router.push(href);
    },
    [router, startNavigation]
  );

  const replace = useCallback(
    (href: string, options?: { scroll?: boolean }) => {
      startNavigation();
      router.replace(href, options);
    },
    [router, startNavigation]
  );

  return { push, replace, router };
}
