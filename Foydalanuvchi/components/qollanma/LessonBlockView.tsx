'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Download, ExternalLink, FileText, PlayCircle } from 'lucide-react';
import DeltaText from '@/components/qollanma/DeltaText';
import type { LessonBlock } from '@/lib/guideCourse';

interface LessonBlockViewProps {
  block: LessonBlock;
}

export default function LessonBlockView({ block }: LessonBlockViewProps) {
  switch (block.type) {
    case 'title':
      return (
        <h2 className="text-xl font-bold text-white md:text-2xl">{block.text}</h2>
      );

    case 'description':
      return (
        <div className="rounded-2xl border border-slate-700/50 bg-slate-900/50 px-4 py-3">
          <DeltaText delta={block.delta} className="text-sm leading-relaxed text-slate-300" />
        </div>
      );

    case 'video':
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-700/60 bg-black shadow-lg shadow-black/20">
          <div className="relative aspect-video">
            <video
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
              poster={block.poster}
            >
              <source src={block.src} type="video/mp4" />
            </video>
          </div>
          {block.caption && (
            <div className="flex items-start gap-2 border-t border-slate-700/50 px-4 py-3">
              <PlayCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-violet-400" />
              <p className="text-sm text-slate-400">{block.caption}</p>
            </div>
          )}
        </div>
      );

    case 'image':
      return (
        <figure className="overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/50">
          <div className="relative aspect-[16/10] bg-slate-800">
            <Image
              src={block.src}
              alt={block.alt ?? ''}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 640px"
            />
          </div>
          {block.caption && (
            <figcaption className="border-t border-slate-700/50 px-4 py-2.5 text-sm text-slate-400">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case 'link': {
      const isInternal = block.href.startsWith('/');
      const content = (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-900/40 bg-blue-950/20 p-4 transition-colors hover:border-blue-700/50 hover:bg-blue-950/30">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-950/50">
            <ExternalLink className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-blue-300">{block.label}</p>
            {block.description && (
              <p className="mt-1 text-sm text-slate-400">{block.description}</p>
            )}
          </div>
        </div>
      );

      if (isInternal) {
        return <Link href={block.href}>{content}</Link>;
      }
      return (
        <a href={block.href} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      );
    }

    case 'file':
      return (
        <a
          href={block.url}
          download
          className="group flex items-start gap-3 rounded-2xl border border-slate-700/60 bg-slate-900/60 p-4 transition-colors hover:border-slate-600 hover:bg-slate-800/60"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-slate-600/60 bg-slate-800/80">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-start justify-between gap-2">
              <p className="font-semibold text-white group-hover:text-blue-200">{block.title}</p>
              <span className="flex-shrink-0 rounded-md border border-slate-600/60 bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-400">
                {block.ext}
              </span>
            </div>
            {block.description && (
              <p className="text-xs leading-relaxed text-slate-400">{block.description}</p>
            )}
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-blue-400">
              <Download className="h-3.5 w-3.5" />
              Yuklab olish · {block.sizeLabel}
            </p>
          </div>
        </a>
      );

    default:
      return null;
  }
}
