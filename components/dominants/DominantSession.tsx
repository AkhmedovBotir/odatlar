'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, X, Zap, Gift } from 'lucide-react';
import Timer from '@/components/Timer';
import PageContainer from '@/components/PageContainer';
import { useUserData } from '@/components/UserDataProvider';
import { DRAFT_KEY } from '@/lib/data';
import type { Dominant, DominantDraft } from '@/lib/types';

interface DominantSessionProps {
  dominantId?: string;
}

type SessionType = 'fikrlash' | 'ma\'lumot';

export default function DominantSession({ dominantId }: DominantSessionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userData, addReward, updateWithRewards } = useUserData();

  const tur = searchParams.get('tur') as SessionType | null;
  const [title, setTitle] = useState('');
  const [cue, setCue] = useState('');
  const [reward, setReward] = useState('');
  const [notes, setNotes] = useState('');
  const [prosList, setProsList] = useState<string[]>([]);
  const [consList, setConsList] = useState<string[]>([]);
  const [currentPro, setCurrentPro] = useState('');
  const [currentCon, setCurrentCon] = useState('');

  useEffect(() => {
    if (!tur || (tur !== 'fikrlash' && tur !== 'ma\'lumot')) {
      router.replace(dominantId ? `/dominantalar/${dominantId}/tur` : '/dominantalar/yangi/tur');
      return;
    }

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
  }, [tur, dominantId, userData, router]);

  const handleTimerComplete = useCallback(() => {
    if (!userData || !tur) return;

    let dominants: Dominant[];

    if (dominantId) {
      dominants = userData.dominants.map((d) =>
        d.id === dominantId
          ? {
              ...d,
              sessionsCompleted: (d.sessionsCompleted || 0) + 1,
              pros: tur === 'fikrlash' ? [...d.pros, ...prosList] : d.pros,
              cons: tur === 'fikrlash' ? [...d.cons, ...consList] : d.cons,
              notes: tur === 'ma\'lumot' && notes ? notes : d.notes,
            }
          : d
      );
    } else {
      const draftRaw = sessionStorage.getItem(DRAFT_KEY);
      if (!draftRaw) return;
      const draft = JSON.parse(draftRaw) as DominantDraft;
      dominants = [
        ...userData.dominants,
        {
          id: `dom_${Date.now()}`,
          title: draft.title.trim(),
          cue: draft.cue.trim(),
          reward: draft.reward.trim(),
          type: tur,
          pros: prosList,
          cons: consList,
          notes: tur === 'ma\'lumot' ? notes : '',
          sessionsCompleted: 1,
        },
      ];
      sessionStorage.removeItem(DRAFT_KEY);
    }

    updateWithRewards({ dominants }, 100, 10);
    addReward(100, 'xp');
    router.push('/dominantalar');
  }, [userData, tur, dominantId, prosList, consList, notes, addReward, updateWithRewards, router]);

  const addPro = () => {
    if (currentPro.trim()) {
      setProsList([...prosList, currentPro.trim()]);
      setCurrentPro('');
    }
  };

  const addCon = () => {
    if (currentCon.trim()) {
      setConsList([...consList, currentCon.trim()]);
      setCurrentCon('');
    }
  };

  if (!tur || !title) return null;

  return (
    <PageContainer>
      <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl p-4 md:p-8 border border-blue-500/30">
        <div className="mb-6 pb-4 border-b border-slate-600/50">
          <p className="text-lg font-bold mb-1">{title}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>
              <Zap className="w-3 h-3 inline text-yellow-400 mr-1" />
              {cue}
            </span>
            <span>
              <Gift className="w-3 h-3 inline text-pink-400 mr-1" />
              {reward}
            </span>
          </div>
        </div>

        <Timer
          duration={600}
          onComplete={handleTimerComplete}
          type={tur}
          prosList={prosList}
          consList={consList}
          notes={notes}
        />

        {tur === 'fikrlash' && (
          <div className="mt-6 md:mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-green-400">Foydalari ➕</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentPro}
                  onChange={(e) => setCurrentPro(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addPro()}
                  placeholder="Yangi odatning foydasini yozing..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                />
                <button onClick={addPro} className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-all flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {prosList.map((pro, idx) => (
                <div key={idx} className="flex items-center justify-between text-green-400 text-sm bg-slate-800/50 rounded px-3 py-1.5 mt-2">
                  <span className="truncate">✓ {pro}</span>
                  <button onClick={() => setProsList(prosList.filter((_, i) => i !== idx))} className="hover:text-red-400 ml-2 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-red-400">Zararlari ➖</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentCon}
                  onChange={(e) => setCurrentCon(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addCon()}
                  placeholder="Eski odatning zararini yozing..."
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
                <button onClick={addCon} className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-all flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {consList.map((con, idx) => (
                <div key={idx} className="flex items-center justify-between text-red-400 text-sm bg-slate-800/50 rounded px-3 py-1.5 mt-2">
                  <span className="truncate">✗ {con}</span>
                  <button onClick={() => setConsList(consList.filter((_, i) => i !== idx))} className="hover:text-red-300 ml-2 flex-shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tur === 'ma\'lumot' && (
          <div className="mt-6 md:mt-8">
            <label className="block text-sm font-medium mb-2">Yozuvlar</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O'rgangan ma'lumotlarni yozing..."
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none h-28"
            />
          </div>
        )}
      </div>
    </PageContainer>
  );
}
