'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import { DRAFT_KEY } from '@/lib/data';
import PageContainer from '@/components/PageContainer';
import type { DominantDraft } from '@/lib/types';

interface DominantPickTypeProps {
  dominantId?: string;
}

export default function DominantPickType({ dominantId }: DominantPickTypeProps) {
  const router = useRouter();
  const { userData } = useUserData();
  const [title, setTitle] = useState('');
  const [cue, setCue] = useState('');

  useEffect(() => {
    if (dominantId && userData) {
      const dominant = userData.dominants.find((d) => d.id === dominantId);
      if (!dominant) {
        router.replace('/dominantalar');
        return;
      }
      setTitle(dominant.title);
      setCue(dominant.cue);
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
    } catch {
      router.replace('/dominantalar/yangi');
    }
  }, [dominantId, userData, router]);

  const basePath = dominantId ? `/dominantalar/${dominantId}` : '/dominantalar/yangi';

  const pickType = (tur: 'fikrlash' | 'ma\'lumot') => {
    router.push(`${basePath}/sessiya?tur=${tur}`);
  };

  if (!title) return null;

  return (
    <PageContainer>
      <div className="bg-slate-800/60 rounded-xl p-4 mb-6 border border-slate-600">
        <p className="text-lg font-bold mb-2">{title}</p>
        <p className="text-sm text-slate-400">
          <Zap className="w-3 h-3 inline text-yellow-400 mr-1" />
          {cue}
        </p>
      </div>

      <h2 className="text-xl font-bold mb-2">Mashq usulini tanlang</h2>
      <p className="text-sm text-slate-400 mb-6">10 daqiqalik sessiya boshlanadi</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          onClick={() => pickType('fikrlash')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl p-6 text-left border border-blue-500/30 transition-all"
        >
          <span className="text-3xl mb-3 block">🤔</span>
          <h3 className="text-lg font-bold mb-1">Fikrlash orqali</h3>
          <p className="text-blue-200 text-sm">
            Odatning foyda va zararlarini yozib, yangi fikrni mustahkamlang
          </p>
        </motion.button>

        <motion.button
          onClick={() => pickType('ma\'lumot')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl p-6 text-left border border-purple-500/30 transition-all"
        >
          <span className="text-3xl mb-3 block">📚</span>
          <h3 className="text-lg font-bold mb-1">Ma&apos;lumot orqali</h3>
          <p className="text-purple-200 text-sm">
            Mavzu bo&apos;yicha o&apos;qing va o&apos;rganganlaringizni yozing
          </p>
        </motion.button>
      </div>
    </PageContainer>
  );
}
