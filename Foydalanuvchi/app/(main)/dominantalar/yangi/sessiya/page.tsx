import { Suspense } from 'react';
import DominantSession from '@/components/dominants/DominantSession';

export default function NewDominantSessionPage() {
  return (
    <Suspense>
      <DominantSession />
    </Suspense>
  );
}
