import DominantPickType from '@/components/dominants/DominantPickType';

export default async function DominantTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DominantPickType dominantId={id} />;
}
