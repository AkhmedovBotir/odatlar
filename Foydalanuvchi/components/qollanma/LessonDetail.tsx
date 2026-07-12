'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Clock3 } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import LessonBlockView from '@/components/qollanma/LessonBlockView';
import { fetchGuideLesson } from '@/lib/coursesApi';
import { getLessonBlockTypes, type LessonContext } from '@/lib/guideCourse';

interface LessonDetailProps {
  lessonId: string;
}

export default function LessonDetail({ lessonId }: LessonDetailProps) {
  const router = useRouter();
  const [context, setContext] = useState<LessonContext | null>(null);
  const [loading, setLoading] = useState(true);

  const loadRemote = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchGuideLesson(lessonId);
      setContext(remote);
    } catch (error) {
      console.error('[LessonDetail] dars yuklash xatosi', error);
      router.replace('/qollanma?tab=kurslar');
    } finally {
      setLoading(false);
    }
  }, [lessonId, router]);

  useEffect(() => {
    loadRemote();
  }, [loadRemote]);

  if (loading) {
    return (
      <PageContainer>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-800/50" />
      </PageContainer>
    );
  }

  if (!context) return null;

  const { lesson, breadcrumb } = context;
  const formats = getLessonBlockTypes(lesson);

  return (
    <PageContainer>
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {breadcrumb.map((item, index) => (
          <span key={item.id} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="h-3 w-3 text-slate-600" />}
            {index < breadcrumb.length - 1 ? (
              <Link href={item.href} className="hover:text-slate-300">
                {item.title}
              </Link>
            ) : (
              <span className="font-medium text-slate-400">{item.title}</span>
            )}
          </span>
        ))}
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md border border-violet-800/40 bg-violet-950/30 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-400">
            dars
          </span>
          {lesson.durationMin && (
            <span className="inline-flex items-center gap-1 text-xs text-slate-500">
              <Clock3 className="h-3.5 w-3.5" />
              {lesson.durationMin} daqiqa
            </span>
          )}
        </div>
        <h1 className="text-xl font-bold text-white md:text-2xl">{lesson.title}</h1>
        {lesson.subtitle && <p className="mt-1 text-sm text-slate-400">{lesson.subtitle}</p>}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {formats.map((fmt) => (
            <span
              key={fmt}
              className="rounded-lg border border-slate-700/50 bg-slate-800/60 px-2 py-0.5 text-[10px] text-slate-400"
            >
              {fmt}
            </span>
          ))}
        </div>
      </motion.div>

      <div className="space-y-4">
        {lesson.blocks.map((block, index) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <LessonBlockView block={block} />
          </motion.div>
        ))}
      </div>
    </PageContainer>
  );
}
