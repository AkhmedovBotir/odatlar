'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Clock3, FolderOpen, PlayCircle } from 'lucide-react';
import {
  getLessonBlockTypes,
  isLesson,
  isSection,
  lessonHref,
  type Course,
  type CourseNode,
} from '@/lib/guideCourse';

function LessonRow({ lesson, index }: { lesson: Extract<CourseNode, { kind: 'dars' }>; index: number }) {
  const formats = getLessonBlockTypes(lesson);

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Link
        href={lessonHref(lesson.id)}
        className="group flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-3 transition-all hover:border-slate-600 hover:bg-slate-800/60"
      >
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-violet-950/50 ring-1 ring-violet-500/30">
          <PlayCircle className="h-4 w-4 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-white group-hover:text-violet-200">{lesson.title}</p>
            <span className="rounded-md border border-violet-800/40 bg-violet-950/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-violet-400">
              dars
            </span>
          </div>
          {lesson.subtitle && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{lesson.subtitle}</p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {lesson.durationMin && (
              <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                <Clock3 className="h-3 w-3" />
                {lesson.durationMin} daq
              </span>
            )}
            {formats.map((fmt) => (
              <span
                key={fmt}
                className="rounded border border-slate-700/60 bg-slate-800/60 px-1.5 py-0.5 text-[9px] text-slate-400"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400" />
      </Link>
    </motion.div>
  );
}

function SectionBlock({
  section,
  sectionIndex,
}: {
  section: Extract<CourseNode, { kind: 'bolim' }>;
  sectionIndex: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sectionIndex * 0.06 }}
      className="space-y-2"
    >
      <div className="flex items-center gap-2 px-1">
        <FolderOpen className="h-4 w-4 text-amber-500/80" />
        <h3 className="text-sm font-bold text-slate-300">{section.title}</h3>
        <span className="rounded-md border border-amber-900/30 bg-amber-950/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-500/80">
          bo&apos;lim
        </span>
      </div>
      <div className="space-y-2 pl-1">
        {section.children.map((child, i) => {
          if (isLesson(child)) {
            return <LessonRow key={child.id} lesson={child} index={i} />;
          }
          return null;
        })}
      </div>
    </motion.section>
  );
}

interface CourseDetailViewProps {
  course: Course;
}

export default function CourseDetailView({ course }: CourseDetailViewProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4">
        <p className="text-sm leading-relaxed text-slate-400">{course.description}</p>
      </div>

      {course.children.map((node, index) => {
        if (isLesson(node)) {
          return <LessonRow key={node.id} lesson={node} index={index} />;
        }
        if (isSection(node)) {
          return <SectionBlock key={node.id} section={node} sectionIndex={index} />;
        }
        return null;
      })}
    </div>
  );
}
