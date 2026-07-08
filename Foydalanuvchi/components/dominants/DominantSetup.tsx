'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Zap, Gift } from 'lucide-react';
import { DRAFT_KEY } from '@/lib/data';
import PageContainer from '@/components/PageContainer';
import type { DominantDraft } from '@/lib/types';

export default function DominantSetup() {
  const router = useRouter();
  const [formData, setFormData] = useState<DominantDraft>({ title: '', cue: '', reward: '' });

  const setupValid = formData.title.trim() && formData.cue.trim() && formData.reward.trim();

  const handleContinue = () => {
    if (!setupValid) return;
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    router.push('/dominantalar/yangi/tur');
  };

  return (
    <PageContainer>
      <p className="text-sm text-slate-400 mb-6">
        Odat tsiklini tushunish uchun uchta asosiy narsani aniqlang.
      </p>

      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 md:p-6 border border-slate-600 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Mashq nomi</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Masalan: Ijtimoiy tarmoqlarni cheklash"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Zap className="w-4 h-4 text-yellow-400" />
            Signal (qachon paydo bo&apos;ladi?)
          </label>
          <input
            type="text"
            value={formData.cue}
            onChange={(e) => setFormData({ ...formData, cue: e.target.value })}
            placeholder="Masalan: Charchoq paytida telefonga qarab qolish"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500/50"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 text-sm font-medium mb-2">
            <Gift className="w-4 h-4 text-pink-400" />
            Mukofot (nima uchun qilasiz?)
          </label>
          <input
            type="text"
            value={formData.reward}
            onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
            placeholder="Masalan: Tezkor dopamin va zerikishdan qochish"
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-400 focus:outline-none focus:border-pink-500/50"
          />
        </div>

        <motion.button
          onClick={handleContinue}
          disabled={!setupValid}
          whileHover={{ scale: setupValid ? 1.02 : 1 }}
          whileTap={{ scale: setupValid ? 0.98 : 1 }}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition-all"
        >
          Davom etish
        </motion.button>
      </div>
    </PageContainer>
  );
}
