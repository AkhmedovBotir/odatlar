'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Download, FileText, Video } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import HabitTabNav from '@/components/habits/HabitTabNav';
import CourseBlockList from '@/components/qollanma/CourseBlockList';
import VideoBlockList from '@/components/qollanma/VideoBlockList';
import {
  guideFiles,
  parseGuideTab,
  type GuideTab,
} from '@/lib/guide';

const tabs: { id: GuideTab; label: string; shortLabel: string; icon: typeof Video }[] = [
  { id: 'video', label: 'Video', shortLabel: 'Video', icon: Video },
  { id: 'kurslar', label: 'Kurslar', shortLabel: 'Kurs', icon: BookOpen },
  { id: 'fayllar', label: 'Fayllar', shortLabel: 'Fayl', icon: FileText },
];

function GuideContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = parseGuideTab(searchParams.get('tab'));

  const setTab = (tab: GuideTab) => {
    if (tab === 'video') {
      router.replace('/qollanma', { scroll: false });
      return;
    }
    router.replace(`/qollanma?tab=${tab}`, { scroll: false });
  };

  return (
    <PageContainer>
      <div className="mb-4">
        <p className="text-sm text-slate-400">
          Videolar, kurslar va yuklab olinadigan materiallar
        </p>
      </div>

      <HabitTabNav
        tabs={tabs}
        activeTab={activeTab}
        onChange={setTab}
        layoutId="guideTab"
        constrained
      />

      <AnimatePresence mode="wait">
        {activeTab === 'video' && (
          <motion.div
            key="video"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mb-3 text-xs text-slate-500">
              Videoni tanlang — to&apos;liq ko&apos;rish uchun ochiladi
            </p>
            <VideoBlockList />
          </motion.div>
        )}

        {activeTab === 'kurslar' && (
          <motion.div
            key="kurslar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="mb-3 text-xs text-slate-500">
              Kursni tanlang — ichida bo&apos;limlar va darslar ochiladi
            </p>
            <CourseBlockList />
          </motion.div>
        )}

        {activeTab === 'fayllar' && (
          <motion.div
            key="fayllar"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {guideFiles.map((file, index) => (
              <motion.a
                key={file.id}
                href={file.url}
                download
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-start gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 transition-colors hover:border-slate-600 hover:bg-slate-800/60"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-600/60 bg-slate-800/80">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="font-semibold text-white group-hover:text-blue-200">
                      {file.title}
                    </p>
                    <span className="flex-shrink-0 rounded-md border border-slate-600/60 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                      {file.ext}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-400">{file.description}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-400">
                    <Download className="h-3.5 w-3.5" />
                    Yuklab olish · {file.sizeLabel}
                  </p>
                </div>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

export default function GuidePage() {
  return (
    <Suspense
      fallback={
        <PageContainer>
          <div className="h-40 animate-pulse rounded-2xl bg-slate-800/50" />
        </PageContainer>
      }
    >
      <GuideContent />
    </Suspense>
  );
}
