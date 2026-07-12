'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText } from 'lucide-react';
import { fetchGuideFiles } from '@/lib/filesApi';
import type { GuideFile } from '@/lib/guide';

function FileBlockCard({ file, index }: { file: GuideFile; index: number }) {
  return (
    <motion.a
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
          <p className="font-semibold text-white group-hover:text-blue-200">{file.title}</p>
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
  );
}

export default function FileBlockList() {
  const [files, setFiles] = useState<GuideFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const remote = await fetchGuideFiles();
        if (!cancelled) setFiles(remote);
      } catch (error) {
        console.error('[FileBlockList] fayllar yuklash xatosi', error);
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
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-800/50" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        Hozircha fayllar mavjud emas
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file, index) => (
        <FileBlockCard key={file.id} file={file} index={index} />
      ))}
    </div>
  );
}
