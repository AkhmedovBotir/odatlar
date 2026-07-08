'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import NotificationBadge from '@/components/notifications/NotificationBadge';
import { findLesson, findCourse } from '@/lib/guideCourse';
import { findExternalVideo } from '@/lib/guide';
import { useNavigation } from '@/components/NavigationProvider';
import { TelegramProfileMenu } from '@/components/topnav/TelegramProfileMenu';

interface TopNavProps {
  showBack?: boolean;
}

const titles: Record<string, string> = {
  '/': 'Bosh sahifa',
  '/statistika': 'Statistika',
  '/odatlar': 'Odatlar',
  '/qollanma': "Qo'llanma",
  '/habarlar': 'Habarlar',
  '/dominantalar': 'Dominantalar',
  '/dominantalar/yangi': 'Yangi dominanta',
};

function getTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname];
  if (pathname.includes('/sessiya')) return 'Mashq sessiyasi';
  if (pathname.includes('/tur')) return 'Mashq usuli';
  if (pathname.match(/^\/dominantalar\/[^/]+$/)) return 'Dominanta mashqi';
  const lessonMatch = pathname.match(/^\/qollanma\/dars\/([^/]+)$/);
  if (lessonMatch) {
    const ctx = findLesson(lessonMatch[1]);
    if (ctx) return ctx.lesson.title;
  }
  const courseMatch = pathname.match(/^\/qollanma\/kurs\/([^/]+)$/);
  if (courseMatch) {
    const course = findCourse(courseMatch[1]);
    if (course) return course.title;
  }
  const videoMatch = pathname.match(/^\/qollanma\/video\/([^/]+)$/);
  if (videoMatch) {
    const video = findExternalVideo(videoMatch[1]);
    if (video) return video.title;
  }
  return 'Odatlar Klub';
}

export default function TopNav({ showBack = false }: TopNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showHabitModal, setShowHabitModal } = useUserData();
  const { startNavigation } = useNavigation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleBack = () => {
    if (showHabitModal) {
      setShowHabitModal(false);
      return;
    }

    startNavigation();

    if (pathname.includes('/sessiya')) {
      router.push(pathname.replace('/sessiya', '/tur'));
      return;
    }
    if (pathname.includes('/tur')) {
      if (pathname.includes('/yangi')) {
        router.push('/dominantalar/yangi');
      } else {
        const id = pathname.split('/')[2];
        router.push(`/dominantalar/${id}`);
      }
      return;
    }
    if (pathname === '/dominantalar/yangi') {
      router.push('/dominantalar');
      return;
    }
    if (pathname.match(/^\/dominantalar\/[^/]+$/)) {
      router.push('/dominantalar');
      return;
    }
    if (pathname.startsWith('/qollanma/dars/')) {
      const lessonId = pathname.split('/').pop();
      const ctx = lessonId ? findLesson(lessonId) : null;
      router.push(ctx ? `/qollanma/kurs/${ctx.course.id}` : '/qollanma?tab=kurslar');
      return;
    }
    if (pathname.startsWith('/qollanma/kurs/')) {
      router.push('/qollanma?tab=kurslar');
      return;
    }
    if (pathname.startsWith('/qollanma/video/')) {
      router.push('/qollanma');
      return;
    }
    router.back();
  };

  const showBackButton = showBack || showHabitModal;
  const title = getTitle(pathname);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="safe-top flex-shrink-0 px-3 sm:px-4 lg:px-8 pt-2 pb-2.5 lg:pt-3 lg:pb-3"
    >
      <div className="max-w-7xl mx-auto">
        {/* Mobile / tablet */}
        <div className="lg:hidden rounded-2xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-lg shadow-sm shadow-black/20 px-3 py-2.5">
          <div className="flex items-center gap-2.5 min-h-[2.5rem]">
            {showBackButton && (
              <motion.button
                onClick={handleBack}
                whileTap={{ scale: 0.95 }}
                className="p-2 -ml-1 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                aria-label="Orqaga"
              >
                <ArrowLeft className="w-5 h-5 text-blue-400" />
              </motion.button>
            )}

            <h1 className="flex-1 min-w-0 text-base sm:text-lg font-bold truncate leading-tight">
              {title}
            </h1>

            <NotificationBadge />

            <TelegramProfileMenu now={now} />
          </div>
        </div>

        {/* Desktop */}
        <div className="hidden lg:flex items-center justify-between gap-4 border-b border-slate-700/50 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            {showBackButton && (
              <motion.button
                onClick={handleBack}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-slate-800 rounded-xl transition-colors flex-shrink-0"
                aria-label="Orqaga"
              >
                <ArrowLeft className="w-5 h-5 text-blue-400" />
              </motion.button>
            )}
            <h1 className="text-2xl xl:text-3xl font-bold truncate">{title}</h1>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBadge />
            <TelegramProfileMenu now={now} />
          </div>
        </div>
      </div>
    </motion.header>
  );
}
