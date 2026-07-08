'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Brain } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import PageContainer from '@/components/PageContainer';
import ConfirmModal from '@/components/ConfirmModal';
import DominantHero from '@/components/dominants/DominantHero';
import DominantCard from '@/components/dominants/DominantCard';
import type { Dominant } from '@/lib/types';
import { deleteDominant, hasTelegramSession } from '@/lib/dominantsApi';

export default function DominantsList() {
  const { userData, updateUserData } = useUserData();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Dominant | null>(null);

  if (!userData) return null;

  const dominants = userData.dominants;
  const totalSessions = dominants.reduce((sum, d) => sum + (d.sessionsCompleted || 0), 0);
  const activeDominants = dominants.filter((d) => (d.sessionsCompleted || 0) > 0);
  const newDominants = dominants.filter((d) => !(d.sessionsCompleted || 0));

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (hasTelegramSession()) {
      try {
        await deleteDominant(deleteTarget.id);
      } catch (error) {
        console.error('[DominantsList] delete xatosi', error);
        return;
      }
    }
    updateUserData({
      dominants: dominants.filter((d) => d.id !== deleteTarget.id),
    });
    setDeleteTarget(null);
  };

  return (
    <PageContainer className="relative">
      <DominantHero dominants={dominants} totalSessions={totalSessions} />

      {dominants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-600 bg-slate-800/30 px-6 py-14 text-center">
          <Brain className="mx-auto mb-3 h-12 w-12 text-slate-600" />
          <p className="font-medium text-slate-300">Hali dominantalar yo&apos;q</p>
          <p className="mt-1 text-sm text-slate-500">
            Zararli odatni signal va mukofot bilan aniqlang, keyin 10 daqiqalik mashq qiling
          </p>
          <button
            onClick={() => router.push('/dominantalar/yangi')}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" />
            Birinchi dominantani yaratish
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {newDominants.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Boshlanmagan ({newDominants.length})
              </h3>
              <div className="space-y-3">
                {newDominants.map((dominant) => (
                  <DominantCard
                    key={dominant.id}
                    dominant={dominant}
                    onDelete={() => setDeleteTarget(dominant)}
                  />
                ))}
              </div>
            </section>
          )}

          {activeDominants.length > 0 && (
            <section>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-violet-500/80">
                Faol ({activeDominants.length})
              </h3>
              <div className="space-y-3">
                {activeDominants.map((dominant) => (
                  <DominantCard
                    key={dominant.id}
                    dominant={dominant}
                    onDelete={() => setDeleteTarget(dominant)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {dominants.length > 0 && (
        <motion.button
          onClick={() => router.push('/dominantalar/yangi')}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-xl shadow-violet-900/50 lg:bottom-8"
          aria-label="Yangi dominanta qo'shish"
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Dominantani o'chirish"
        message={`"${deleteTarget?.title}" dominantasini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </PageContainer>
  );
}
