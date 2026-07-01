'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Brain, Zap, Gift, Play, Trash2 } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import PageContainer from '@/components/PageContainer';
import ConfirmModal from '@/components/ConfirmModal';
import type { Dominant } from '@/lib/types';

export default function DominantsList() {
  const { userData, updateUserData } = useUserData();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<Dominant | null>(null);

  if (!userData) return null;

  const totalSessions = userData.dominants.reduce(
    (sum, d) => sum + (d.sessionsCompleted || 0),
    0
  );

  const confirmDelete = () => {
    if (!deleteTarget) return;
    updateUserData({
      dominants: userData.dominants.filter((d) => d.id !== deleteTarget.id),
    });
    setDeleteTarget(null);
  };

  return (
    <PageContainer>
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">🧠 Dominantalar</h1>
        <p className="text-sm md:text-base text-slate-400 leading-relaxed">
          Zararli odatni yangi fikr bilan almashtiring — signal va mukofotni aniqlang,
          keyin 10 daqiqalik mashq bilan miyangizni qayta yo&apos;naltiring.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6 md:mb-8">
        <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-lg p-4 border border-purple-500/30">
          <p className="text-xs text-purple-300 mb-1">Dominantalar</p>
          <p className="text-2xl md:text-3xl font-bold text-purple-300">{userData.dominants.length}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-4 border border-blue-500/30">
          <p className="text-xs text-blue-300 mb-1">Jami sessiyalar</p>
          <p className="text-2xl md:text-3xl font-bold text-blue-300">{totalSessions}</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg md:text-xl font-bold">Mening dominantalarim</h2>
        <Link href="/dominantalar/yangi">
          <motion.span
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg px-3 md:px-4 py-2 text-sm font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yangi dominanta</span>
            <span className="sm:hidden">Qo&apos;shish</span>
          </motion.span>
        </Link>
      </div>

      {userData.dominants.length === 0 ? (
        <div className="bg-slate-800/50 rounded-xl p-8 md:p-12 border border-dashed border-slate-600 text-center">
          <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">
            Hali dominanta qo&apos;shilmagan. Birinchi zararli odatni aniqlang va mashq qiling.
          </p>
          <button
            onClick={() => router.push('/dominantalar/yangi')}
            className="bg-purple-600 hover:bg-purple-500 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all"
          >
            Birinchi dominantani yaratish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {userData.dominants.map((dominant, index) => (
            <motion.div
              key={dominant.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 md:p-6 border border-slate-600"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <h3 className="text-lg md:text-xl font-bold break-words flex-1">{dominant.title}</h3>
                <button
                  onClick={() => setDeleteTarget(dominant)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 flex-shrink-0"
                  aria-label="O'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <Zap className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400">Signal: </span>
                    <span className="text-slate-200">{dominant.cue}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Gift className="w-4 h-4 text-pink-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400">Mukofot: </span>
                    <span className="text-slate-200">{dominant.reward}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4 text-xs">
                {dominant.pros?.length > 0 && (
                  <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded-full border border-green-500/20">
                    +{dominant.pros.length} foyda
                  </span>
                )}
                {dominant.cons?.length > 0 && (
                  <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded-full border border-red-500/20">
                    −{dominant.cons.length} zarar
                  </span>
                )}
                <span className="bg-blue-900/30 text-blue-400 px-2 py-1 rounded-full border border-blue-500/20">
                  {dominant.sessionsCompleted || 0} sessiya
                </span>
              </div>

              <Link href={`/dominantalar/${dominant.id}/tur`}>
                <span className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 rounded-lg py-2.5 text-sm font-semibold transition-all cursor-pointer">
                  <Play className="w-4 h-4" />
                  Mashq qilish
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
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
