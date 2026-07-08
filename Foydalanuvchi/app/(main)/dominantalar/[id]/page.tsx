import DominantDetail from '@/components/dominants/DominantDetail';

export default async function DominantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DominantDetail id={id} />;
}
