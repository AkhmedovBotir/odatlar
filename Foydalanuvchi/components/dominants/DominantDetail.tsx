'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Brain, Gift, Play, Trash2, Zap } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import PageContainer from '@/components/PageContainer';
import ConfirmModal from '@/components/ConfirmModal';
import { getHabitColor } from '@/lib/habitColors';
import { deleteDominant, hasTelegramSession } from '@/lib/dominantsApi';
const typeLabels = {
  fikrlash: 'Fikrlash',
  "ma'lumot": "Ma'lumot",
} as const;

interface DominantDetailProps {
  id: string;
}

export default function DominantDetail({ id }: DominantDetailProps) {
  const router = useRouter();
  const { userData, updateUserData } = useUserData();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dominant = userData?.dominants.find((d) => d.id === id);

  useEffect(() => {
    if (userData && !dominant) {
      router.replace('/dominantalar');
    }
  }, [userData, dominant, router]);

  if (!userData || !dominant) return null;

  const color = getHabitColor(dominant.id);
  const sessions = dominant.sessionsCompleted || 0;
  const typeLabel = typeLabels[dominant.type] ?? dominant.type;

  const confirmDelete = async () => {
    if (hasTelegramSession()) {
      try {
        await deleteDominant(id);
      } catch (error) {
        console.error('[DominantDetail] delete xatosi', error);
        return;
      }
    }
    updateUserData({
      dominants: userData.dominants.filter((d) => d.id !== id),
    });
    setDeleteOpen(false);
    router.push('/dominantalar');
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-900/70 shadow-lg shadow-black/20 ${color.border} ${color.gradient}`}
      >
        <div className="p-4 md:p-5">
          <div className="mb-4 flex items-start gap-3">
            <div
              className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${color.ring}`}
            >
              <Brain className={`h-6 w-6 ${color.accent}`} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="text-lg font-bold leading-snug text-white md:text-xl">
                  {dominant.title}
                </h2>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-800/80 hover:text-red-400"
                  aria-label="O'chirish"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-violet-500/30 bg-violet-950/40 px-2 py-0.5 text-[10px] font-semibold text-violet-300">
                  {typeLabel}
                </span>
                <span className="rounded-full border border-slate-600/60 bg-slate-900/50 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                  {sessions} sessiya
                </span>
              </div>
            </div>
          </div>

          <div className="mb-4 space-y-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Signal
                </p>
                <p className="text-sm leading-snug text-slate-300">{dominant.cue}</p>
              </div>
            </div>
            <div className="h-px bg-slate-700/50" />
            <div className="flex items-start gap-2">
              <Gift className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pink-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Mukofot
                </p>
                <p className="text-sm leading-snug text-slate-300">{dominant.reward}</p>
              </div>
            </div>
          </div>

          {(dominant.pros?.length > 0 || dominant.cons?.length > 0) && (
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {dominant.pros?.length > 0 && (
                <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-3 py-2.5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-500/80">
                    Foydalar
                  </p>
                  <ul className="space-y-1">
                    {dominant.pros.map((pro) => (
                      <li key={pro} className="text-xs text-emerald-300/90">
                        + {pro}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {dominant.cons?.length > 0 && (
                <div className="rounded-xl border border-red-900/40 bg-red-950/20 px-3 py-2.5">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-red-500/80">
                    Zararlar
                  </p>
                  <ul className="space-y-1">
                    {dominant.cons.map((con) => (
                      <li key={con} className="text-xs text-red-300/90">
                        − {con}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {dominant.notes && (
            <div className="mb-4 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2.5">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Eslatmalar
              </p>
              <p className="text-sm leading-relaxed text-slate-300">{dominant.notes}</p>
            </div>
          )}

          <Link href={`/dominantalar/${dominant.id}/tur`} className="block">
            <span className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-md shadow-violet-900/30 transition-all hover:from-violet-500 hover:to-indigo-500">
              <Play className="h-4 w-4 fill-current" />
              Mashq boshlash
            </span>
          </Link>
        </div>
      </motion.div>

      <ConfirmModal
        open={deleteOpen}
        title="Dominantani o'chirish"
        message={`"${dominant.title}" dominantasini o'chirmoqchimisiz?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  );
}
