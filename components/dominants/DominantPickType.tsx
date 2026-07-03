'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Clock3,
  Gift,
  Lightbulb,
  PenLine,
  Zap,
} from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import { DRAFT_KEY } from '@/lib/data';
import PageContainer from '@/components/PageContainer';
import { getHabitColor } from '@/lib/habitColors';
import type { DominantDraft } from '@/lib/types';

interface DominantPickTypeProps {
  dominantId?: string;
}

const METHODS = [
  {
    id: 'fikrlash' as const,
    title: 'Fikrlash orqali',
    description: 'Odatning foyda va zararlarini yozib, yangi fikrni mustahkamlang',
    icon: Lightbulb,
    accent: 'text-sky-400',
    ring: 'ring-sky-500/40',
    border: 'border-sky-700/50',
    gradient: 'from-sky-950/60 via-slate-900/80 to-slate-900',
    badge: 'bg-sky-950/50 border-sky-700/40 text-sky-300',
    cta: 'from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500',
    steps: ['Foyda va zararlar', 'Yangi fikr', 'Mustahkamlash'],
  },
  {
    id: "ma'lumot" as const,
    title: "Ma'lumot orqali",
    description: "Mavzu bo'yicha o'qing va o'rganganlaringizni yozing",
    icon: BookOpen,
    accent: 'text-violet-400',
    ring: 'ring-violet-500/40',
    border: 'border-violet-700/50',
    gradient: 'from-violet-950/60 via-slate-900/80 to-slate-900',
    badge: 'bg-violet-950/50 border-violet-700/40 text-violet-300',
    cta: 'from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500',
    steps: ['Mavzuni tanlash', "O'qish", 'Xulosa yozish'],
  },
];

export default function DominantPickType({ dominantId }: DominantPickTypeProps) {
  const router = useRouter();
  const { userData } = useUserData();
  const [title, setTitle] = useState('');
  const [cue, setCue] = useState('');
  const [reward, setReward] = useState('');

  useEffect(() => {
    if (dominantId && userData) {
      const dominant = userData.dominants.find((d) => d.id === dominantId);
      if (!dominant) {
        router.replace('/dominantalar');
        return;
      }
      setTitle(dominant.title);
      setCue(dominant.cue);
      setReward(dominant.reward);
      return;
    }

    const draftRaw = sessionStorage.getItem(DRAFT_KEY);
    if (!draftRaw) {
      router.replace('/dominantalar/yangi');
      return;
    }
    try {
      const draft = JSON.parse(draftRaw) as DominantDraft;
      setTitle(draft.title);
      setCue(draft.cue);
      setReward(draft.reward);
    } catch {
      router.replace('/dominantalar/yangi');
    }
  }, [dominantId, userData, router]);

  const basePath = dominantId ? `/dominantalar/${dominantId}` : '/dominantalar/yangi';
  const color = getHabitColor(dominantId ?? 'draft');

  const pickType = (tur: 'fikrlash' | "ma'lumot") => {
    router.push(`${basePath}/sessiya?tur=${tur}`);
  };

  if (!title) return null;

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mb-5 overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-900/70 shadow-lg shadow-black/20 ${color.border} ${color.gradient}`}
      >
        <div className="p-4 md:p-5">
          <div className="mb-4 flex items-center gap-3">
            <div
              className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${color.ring}`}
            >
              <Brain className={`h-5 w-5 ${color.accent}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Mashq usuli
              </p>
              <p className="truncate text-base font-bold text-white md:text-lg">{title}</p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-violet-800/40 bg-violet-950/40 px-2.5 py-1.5">
              <Clock3 className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-bold tabular-nums text-violet-300">10 daq</span>
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <Zap className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Signal
                </p>
                <p className="text-xs leading-snug text-slate-300">{cue}</p>
              </div>
            </div>
            {reward && (
              <>
                <div className="h-px bg-slate-700/50" />
                <div className="flex items-start gap-2">
                  <Gift className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-pink-400" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                      Mukofot
                    </p>
                    <p className="text-xs leading-snug text-slate-300">{reward}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="mb-4">
        <h2 className="text-sm font-bold text-white md:text-base">Usulni tanlang</h2>
        <p className="mt-1 text-xs text-slate-400 md:text-sm">
          Qaysi yo&apos;l bilan 10 daqiqalik sessiyani boshlaysiz?
        </p>
      </div>

      <div className="space-y-3">
        {METHODS.map((method, index) => {
          const Icon = method.icon;
          return (
            <motion.button
              key={method.id}
              type="button"
              onClick={() => pickType(method.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileTap={{ scale: 0.98 }}
              className={`group w-full overflow-hidden rounded-2xl border bg-gradient-to-br text-left shadow-sm transition-shadow hover:shadow-md hover:shadow-black/20 ${method.border} ${method.gradient}`}
            >
              <div className="p-4">
                <div className="mb-3 flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${method.ring}`}
                  >
                    <Icon className={`h-5 w-5 ${method.accent}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white md:text-base">{method.title}</p>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${method.badge}`}
                      >
                        {method.id === 'fikrlash' ? 'Yozish' : "O'qish"}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">{method.description}</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {method.steps.map((step) => (
                    <span
                      key={step}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-700/50 bg-slate-900/50 px-2 py-1 text-[10px] text-slate-400"
                    >
                      <PenLine className="h-2.5 w-2.5 opacity-60" />
                      {step}
                    </span>
                  ))}
                </div>

                <span
                  className={`flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r py-2.5 text-sm font-semibold text-white shadow-md transition-all ${method.cta}`}
                >
                  Boshlash
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </PageContainer>
  );
}
