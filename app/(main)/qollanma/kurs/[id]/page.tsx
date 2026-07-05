import CourseDetail from '@/components/qollanma/CourseDetail';

export default async function CoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CourseDetail courseId={id} />;
}
