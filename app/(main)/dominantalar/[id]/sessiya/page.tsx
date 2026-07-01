import { Suspense } from 'react';
import DominantSession from '@/components/dominants/DominantSession';

export default async function DominantSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense>
      <DominantSession dominantId={id} />
    </Suspense>
  );
}
