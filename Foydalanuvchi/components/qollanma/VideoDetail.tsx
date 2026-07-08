'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock3, PlayCircle } from 'lucide-react';
import PageContainer from '@/components/PageContainer';
import { findExternalVideo } from '@/lib/guide';

interface VideoDetailProps {
  videoId: string;
}

export default function VideoDetail({ videoId }: VideoDetailProps) {
  const router = useRouter();
  const video = findExternalVideo(videoId);

  useEffect(() => {
    if (!video) {
      router.replace('/qollanma');
    }
  }, [video, router]);

  if (!video) return null;

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-lg shadow-black/20"
      >
        <div className="relative aspect-video bg-black">
          <video
            className="h-full w-full object-contain"
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={video.poster}
          >
            <source src={video.src} type="video/mp4" />
            Brauzeringiz video formatini qo&apos;llab-quvvatlamaydi.
          </video>
        </div>

        <div className="border-t border-slate-700/50 p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-violet-800/40 bg-violet-950/30 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-400">
              video
            </span>
            {video.durationMin && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Clock3 className="h-3.5 w-3.5" />
                {video.durationMin} daqiqa
              </span>
            )}
          </div>

          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-violet-950/50 ring-2 ring-violet-500/30">
              <PlayCircle className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white md:text-2xl">{video.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{video.description}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </PageContainer>
  );
}
