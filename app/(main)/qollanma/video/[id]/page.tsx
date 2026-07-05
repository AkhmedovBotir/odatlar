import VideoDetail from '@/components/qollanma/VideoDetail';

export default async function VideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <VideoDetail videoId={id} />;
}
