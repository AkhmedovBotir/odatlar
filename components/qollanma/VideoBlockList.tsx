'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronRight, Clock3, PlayCircle, Video } from 'lucide-react';
import { externalVideos, videoHref, type ExternalVideo } from '@/lib/guide';

function VideoBlockCard({ video, index }: { video: ExternalVideo; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Link
        href={videoHref(video.id)}
        className="group block overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/80 shadow-lg shadow-black/20 transition-all hover:border-violet-700/50 hover:shadow-violet-900/10"
      >
        <div className="relative aspect-video bg-black">
          {video.poster ? (
            <Image
              src={video.poster}
              alt={video.title}
              fill
              className="object-cover opacity-80 transition-opacity group-hover:opacity-60"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-950/70 ring-2 ring-violet-500/50 transition-transform group-hover:scale-110">
              <PlayCircle className="h-7 w-7 text-violet-400" />
            </div>
          </div>
          <span className="absolute left-3 top-3 rounded-md border border-violet-800/40 bg-violet-950/70 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-300">
            video
          </span>
        </div>

        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-violet-950/50 ring-2 ring-violet-500/30">
              <Video className="h-5 w-5 text-violet-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-white group-hover:text-violet-100">{video.title}</p>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-400">
                {video.description}
              </p>
              {video.durationMin && (
                <p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="h-3.5 w-3.5" />
                  {video.durationMin} daqiqa
                </p>
              )}
            </div>
            <ChevronRight className="mt-1 h-5 w-5 flex-shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default function VideoBlockList() {
  return (
    <div className="space-y-3">
      {externalVideos.map((video, index) => (
        <VideoBlockCard key={video.id} video={video} index={index} />
      ))}
    </div>
  );
}
