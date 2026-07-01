import { motion } from 'framer-motion';
import { TrendingUp, Award, Star, Flame } from 'lucide-react';

interface DashboardProps {
  userData: any;
  addReward: (amount: number, type: string) => void;
}

export default function Dashboard({ userData, addReward }: DashboardProps) {
  const totalHabitsCompleted = userData.goodHabits.filter((h: any) => h.completedToday).length;
  const totalHabits = userData.goodHabits.length;
  const incompleteHabits = totalHabits - totalHabitsCompleted;
  const progressPercent = (userData.xp / userData.nextLevelXp) * 100;

  const podium = userData.leaderboard.slice(0, 3).sort((a: any, b: any) => a.rank - b.rank);

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-slate-400 to-slate-600';
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '';
    }
  };

  const getPodiumHeight = (rank: number) => {
    switch (rank) {
      case 1:
        return 'h-32';
      case 2:
        return 'h-24';
      case 3:
        return 'h-16';
      default:
        return 'h-12';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Header Stats Cards */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {/* Completed Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg p-3 md:p-6 border border-green-500/30"
        >
          <p className="text-xs md:text-sm text-green-300 font-medium mb-2">BUGUN BAJARILGAN</p>
          <p className="text-2xl md:text-4xl font-bold text-green-400">{totalHabitsCompleted}</p>
          <p className="text-xs text-green-300/60 mt-1">ta odatni bajardiniz</p>
        </motion.div>

        {/* Total Habits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-3 md:p-6 border border-blue-500/30"
        >
          <p className="text-xs md:text-sm text-blue-300 font-medium mb-2">UMUMIY ODATLAR</p>
          <p className="text-2xl md:text-4xl font-bold text-blue-400">{totalHabits}</p>
          <p className="text-xs text-blue-300/60 mt-1">jami mavjud</p>
        </motion.div>

        {/* Incomplete */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-lg p-3 md:p-6 border border-orange-500/30"
        >
          <p className="text-xs md:text-sm text-orange-300 font-medium mb-2">BAJARILMAGAN</p>
          <p className="text-2xl md:text-4xl font-bold text-orange-400">{incompleteHabits}</p>
          <p className="text-xs text-orange-300/60 mt-1">qolgan ish</p>
        </motion.div>
      </div>

      {/* User Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-slate-400 text-xs md:text-sm font-medium">LEVEL</span>
            <Award className="w-4 md:w-5 h-4 md:h-5 text-yellow-400" />
          </div>
          <p className="text-3xl md:text-4xl font-bold text-white">{userData.level}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-slate-400 text-xs md:text-sm font-medium">XP</span>
            <Star className="w-4 md:w-5 h-4 md:h-5 text-yellow-400" />
          </div>
          <p className="text-3xl md:text-4xl font-bold text-white">{userData.xp}</p>
          <p className="text-xs text-slate-500 mt-1 md:mt-2">keyingi: {userData.nextLevelXp}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-slate-400 text-xs md:text-sm font-medium">COINS</span>
            <span className="text-xl md:text-2xl">🪙</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold text-white">{userData.coins}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <span className="text-slate-400 text-xs md:text-sm font-medium">STREAK</span>
            <Flame className="w-4 md:w-5 h-4 md:h-5 text-red-500" />
          </div>
          <p className="text-3xl md:text-4xl font-bold">{userData.goodHabits[0]?.streak || 0}</p>
        </motion.div>
      </div>

      {/* XP Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600 mb-6 md:mb-8"
      >
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold">Level {userData.level} ga ko'tarilish</h3>
          <TrendingUp className="w-4 md:w-5 h-4 md:h-5 text-blue-400" />
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
          />
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-2">{userData.xp} / {userData.nextLevelXp} XP</p>
      </motion.div>

      {/* Podium Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mb-8"
      >
        <h3 className="text-lg md:text-xl font-semibold mb-6">🏆 Klub Reytingi</h3>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 md:gap-4 mb-8 h-40 md:h-48">
          {[2, 1, 3].map((position) => {
            const member = podium.find((m: any) => m.rank === position);
            if (!member) return null;

            return (
              <motion.div
                key={position}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + position * 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-3xl md:text-5xl mb-2"
                >
                  {getMedalEmoji(position)}
                </motion.div>

                <div
                  className={`${getPodiumHeight(
                    position
                  )} w-20 md:w-28 bg-gradient-to-b ${getMedalColor(
                    position
                  )} rounded-t-lg border-2 border-slate-600 flex flex-col items-center justify-end pb-3 md:pb-4`}
                >
                  <p className="text-lg md:text-2xl font-bold">{position}</p>
                </div>

                <div className="text-center mt-3 md:mt-4 w-20 md:w-28">
                  <p className="text-sm md:text-base font-semibold truncate">{member.name}</p>
                  <p className="text-xs md:text-sm text-slate-400">L{member.level}</p>
                  <p className="text-xs text-blue-400 font-bold">{member.xp} XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Full Leaderboard */}
        <div className="space-y-2 md:space-y-3">
          {userData.leaderboard.map((member: any, index: number) => (
            <motion.div
              key={member.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.2 + index * 0.05 }}
              className={`flex items-center justify-between p-3 md:p-4 rounded-lg transition-all gap-2 ${
                member.name === userData.name
                  ? 'bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/50'
                  : 'bg-slate-700/50 hover:bg-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <span className="text-lg md:text-xl font-bold text-slate-500 flex-shrink-0 w-6 md:w-8">
                  {member.rank}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate">{member.name}</p>
                  <p className="text-xs md:text-sm text-slate-400">Level {member.level}</p>
                </div>
              </div>
              <p className="font-bold text-blue-400 text-sm md:text-base flex-shrink-0">
                {member.xp} XP
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
