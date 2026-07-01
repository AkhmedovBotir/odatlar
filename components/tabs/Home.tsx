import { motion } from 'framer-motion';
import { Flame, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';

interface HomeProps {
  userData: any;
  addReward: (amount: number, type: string) => void;
}

export default function Home({ userData, addReward }: HomeProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Xayrli tong';
    if (hour < 17) return 'Xayrli kunduzi';
    return 'Xayrli oqshom';
  };

  const completedToday = userData.goodHabits.filter((h: any) => h.completedToday).length;
  const totalHabits = userData.goodHabits.length;
  const currentStreak = userData.goodHabits[0]?.streak || 0;

  const motivationalMessages = [
    'Bugun o\'zingizni yangi darajaga ko\'taring! 🚀',
    'Har bir kichik qadam katta natijaga olib boriladi! 💪',
    'Siz imkon-uksizligi bilmaysiz, shuning uchun mumkin! ✨',
    'Bugun hamma narsani boshqarishingiz mumkin! 🎯',
    'O\'zingizga ishonayin, siz qodir! 💎',
  ];

  const motivationalMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  const completionPercentage = Math.round((completedToday / totalHabits) * 100);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Greeting Section */}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg p-4 border border-green-500/30 text-center"
        >
          <p className="text-xs md:text-sm text-green-300 font-medium mb-2">Bugun</p>
          <p className="text-3xl md:text-4xl font-bold text-green-400">{completedToday}/{totalHabits}</p>
          <p className="text-xs text-green-300/60 mt-1">{completionPercentage}%</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-red-900/40 to-red-800/20 rounded-lg p-4 border border-red-500/30 text-center"
        >
          <p className="text-xs md:text-sm text-red-300 font-medium mb-2">Streyk</p>
          <p className="text-3xl md:text-4xl font-bold text-red-400">{currentStreak}</p>
          <p className="text-xs text-red-300/60 mt-1">kunlik</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-4 border border-blue-500/30 text-center"
        >
          <p className="text-xs md:text-sm text-blue-300 font-medium mb-2">Level</p>
          <p className="text-3xl md:text-4xl font-bold text-blue-400">{userData.level}</p>
          <p className="text-xs text-blue-300/60 mt-1">{userData.xp} XP</p>
        </motion.div>
      </div>

      {/* Quick Habit Cards */}
      <div className="mb-8">
        <h2 className="text-xl md:text-2xl font-bold mb-4">Bugungi Odatlar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userData.goodHabits.slice(0, 4).map((habit: any, idx: number) => (
            <motion.div
              key={habit.id}
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
                  <h3 className={`font-semibold truncate ${habit.completedToday ? 'line-through text-slate-500' : 'text-white'}`}>
                    {habit.name}
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 mt-1">🔥 {habit.streak} kun</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dominants Shortcuts */}
      {userData.dominants.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-4">Dominanta Mashqlari</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userData.dominants.map((dominant: any, idx: number) => (
              <motion.div
                key={dominant.id}
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
