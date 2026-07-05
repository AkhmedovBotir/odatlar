'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import CourseDetailView from '@/components/qollanma/CourseDetailView';
import { countLessons, findCourse, isSection } from '@/lib/guideCourse';

interface CourseDetailProps {
  courseId: string;
}

export default function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const course = findCourse(courseId);

  useEffect(() => {
    if (!course) {
      router.replace('/qollanma?tab=kurslar');
    }
  }, [course, router]);

  if (!course) return null;

  const totalLessons = countLessons(course.children);
  const sectionCount = course.children.filter(isSection).length;

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-900 p-4 shadow-lg shadow-black/20"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-950/50 ring-2 ring-violet-500/30">
            <BookOpen className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Kurs
            </p>
            <h1 className="text-xl font-bold text-white md:text-2xl">{course.title}</h1>
            <div className="mt-2 flex gap-2">
              <span className="rounded-lg border border-violet-900/40 bg-violet-950/30 px-2.5 py-1 text-xs font-semibold text-violet-300">
                {totalLessons} ta dars
              </span>
              <span className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400">
                {sectionCount} bo&apos;lim
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <CourseDetailView course={course} />
    </PageContainer>
  );
}
