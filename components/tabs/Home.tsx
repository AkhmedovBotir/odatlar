'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/components/UserDataProvider';
import PageContainer from '@/components/PageContainer';
import UserProfileCard from '@/components/profile/UserProfileCard';
import { getBestStreak } from '@/lib/gamification';
import { getPractices } from '@/lib/indicators';

const motivationalMessages = [
  'Bugun o\'zingizni yangi darajaga ko\'taring! 🚀',
  'Har bir kichik qadam katta natijaga olib boriladi! 💪',
  'Siz imkonsizlik bilmaysiz, shuning uchun mumkin! ✨',
  'Bugun hamma narsani boshqarishingiz mumkin! 🎯',
  'O\'zingizga ishonayin, siz qodir! 💎',
];

export default function Home() {
  const { userData } = useUserData();

  const motivationalMessage = useMemo(
    () => motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
    []
  );

  if (!userData) return null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Xayrli tong';
    if (hour < 17) return 'Xayrli kunduzi';
    return 'Xayrli oqshom';
  };

  const practices = getPractices(userData.goodHabits);
  const completedToday = practices.filter((h) => h.completedToday).length;
  const totalHabits = practices.length;
  const currentStreak = getBestStreak(practices);
  const completionPercentage = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;

  return (
    <PageContainer>
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-4xl font-bold mb-2"
        >
          {getGreeting()}, {userData.name}! 👋
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base md:text-lg text-blue-300 font-medium"
        >
          {motivationalMessage}
        </motion.p>
      </div>

      <UserProfileCard userData={userData} />

      <div className="grid grid-cols-1 min-[420px]:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg p-4 border border-green-500/30 text-center"
        >
          <p className="text-xs md:text-sm text-green-300 font-medium mb-2">Bugun</p>
          <p className="text-3xl md:text-4xl font-bold text-green-400">
            {completedToday}/{totalHabits}
          </p>
          <p className="text-xs text-green-300/60 mt-1">{completionPercentage}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-lg p-4 border border-red-500/30 text-center"
        >
          <p className="text-xs md:text-sm text-red-300 font-medium mb-2">Eng yaxshi streyk</p>
          <p className="text-3xl md:text-4xl font-bold text-red-400">{currentStreak}</p>
          <p className="text-xs text-red-300/60 mt-1">kun</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-4 border border-blue-500/30 text-center"
        >
          <p className="text-xs md:text-sm text-blue-300 font-medium mb-2">Daraja</p>
          <p className="text-3xl md:text-4xl font-bold text-blue-400">{userData.level}</p>
          <p className="text-xs text-blue-300/60 mt-1">{userData.xp} XP</p>
        </motion.div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Bugungi Odatlar</h2>
          <Link href="/odatlar" className="text-sm text-blue-400 hover:text-blue-300">
            Barchasi →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
          {practices.slice(0, 4).map((habit, idx) => (
            <Link key={habit.id} href="/odatlar">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.1 }}
                className={`rounded-lg p-4 border transition-all ${
                  habit.completedToday
                    ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-500/30'
                    : 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  {habit.completedToday ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-slate-500 rounded-full flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`font-semibold truncate ${
                        habit.completedToday ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    >
                      {habit.name}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">🔥 {habit.streak} kun</p>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      {userData.dominants.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Dominantalar</h2>
            <Link href="/dominantalar" className="text-sm text-purple-400 hover:text-purple-300">
              Barchasi →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {userData.dominants.slice(0, 2).map((dominant, idx) => (
              <Link key={dominant.id} href={`/dominantalar/${dominant.id}/tur`}>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + idx * 0.1 }}
                  className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg p-4 border border-purple-500/30 hover:border-purple-500/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate">{dominant.title}</h3>
                      <p className="text-xs text-purple-400/80 truncate">⚡ {dominant.cue}</p>
                      <p className="text-xs text-purple-400/60 mt-2">
                        {dominant.sessionsCompleted} sessiya
                      </p>
                    </div>
                    <span className="text-2xl flex-shrink-0 ml-2">🧠</span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
