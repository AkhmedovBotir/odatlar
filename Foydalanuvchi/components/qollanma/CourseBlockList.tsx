'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ChevronRight } from 'lucide-react';
import { countLessons, courseHref, isSection } from '@/lib/guideCourse';
import { fetchGuideCourses, type CourseListItem } from '@/lib/coursesApi';

function CourseBlockCard({ course, index }: { course: CourseListItem; index: number }) {
  const totalLessons =
    course.lessonCount ?? (course.children ? countLessons(course.children) : 0);
  const sectionCount =
    course.sectionCount ?? (course.children ? course.children.filter(isSection).length : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        href={courseHref(course.id)}
        className="group block overflow-hidden rounded-2xl border border-slate-700/60 bg-gradient-to-br from-violet-950/40 via-slate-900/80 to-slate-900 shadow-lg shadow-black/20 transition-all hover:border-violet-700/50 hover:shadow-violet-900/10"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-violet-950/50 ring-2 ring-violet-500/30">
              <BookOpen className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Kurs
              </p>
              <p className="text-lg font-bold text-white group-hover:text-violet-100">
                {course.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-400">{course.description}</p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
          </div>
          <div className="mt-3 flex gap-2 border-t border-slate-700/50 pt-3">
            <span className="rounded-lg border border-violet-900/40 bg-violet-950/30 px-2.5 py-1 text-xs font-semibold text-violet-300">
              {totalLessons} ta dars
            </span>
            <span className="rounded-lg border border-slate-700/60 bg-slate-800/60 px-2.5 py-1 text-xs text-slate-400">
              {sectionCount} bo&apos;lim
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function CourseBlockList() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchGuideCourses();
        if (!cancelled) setCourses(remote);
      } catch (error) {
        console.error('[CourseBlockList] kurslar yuklash xatosi', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        Hozircha kurslar mavjud emas
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {courses.map((course, index) => (
        <CourseBlockCard key={course.id} course={course} index={index} />
      ))}
    </div>
  );
}
