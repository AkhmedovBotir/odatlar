'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, FileText, Video } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import HabitTabNav from '@/components/habits/HabitTabNav';
import CourseBlockList from '@/components/qollanma/CourseBlockList';
import FileBlockList from '@/components/qollanma/FileBlockList';
import VideoBlockList from '@/components/qollanma/VideoBlockList';
import {
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
          >
            <p className="mb-3 text-xs text-slate-500">
              Materiallarni yuklab oling
            </p>
            <FileBlockList />
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
