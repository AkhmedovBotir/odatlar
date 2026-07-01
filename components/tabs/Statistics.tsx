import { motion } from 'framer-motion';
import { Award, Star, TrendingUp } from 'lucide-react';

interface StatisticsProps {
  userData: any;
}

export default function Statistics({ userData }: StatisticsProps) {
  const progressPercent = (userData.xp / userData.nextLevelXp) * 100;
  const podium = userData.leaderboard.slice(0, 3).sort((a: any, b: any) => a.rank - b.rank);
  const remainingLeaderboard = userData.leaderboard.filter((member: any) => member.rank > 3);

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
      {/* User Profile Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0 }}
        className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded-lg p-6 md:p-8 border border-blue-500/30 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2">{userData.name}</h2>
            <p className="text-sm md:text-base text-slate-300">Level {userData.level} | Rank #{userData.leaderboard.find((m: any) => m.name === userData.name)?.rank || '-'}</p>
          </div>
          <div className="text-4xl">👤</div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs md:text-sm text-slate-400 mb-1">XP</p>
            <p className="text-2xl md:text-3xl font-bold text-blue-400">{userData.xp}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-slate-400 mb-1">COINS</p>
            <p className="text-2xl md:text-3xl font-bold text-yellow-400">{userData.coins}</p>
          </div>
          <div>
            <p className="text-xs md:text-sm text-slate-400 mb-1">LEVEL</p>
            <p className="text-2xl md:text-3xl font-bold text-purple-400">{userData.level}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs md:text-sm text-slate-300">Next Level Progress</span>
            <span className="text-xs md:text-sm text-slate-400">{userData.xp} / {userData.nextLevelXp}</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 md:mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs md:text-sm font-medium">LEVEL</span>
            <Award className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl md:text-4xl font-bold">{userData.level}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs md:text-sm font-medium">XP</span>
            <Star className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-3xl md:text-4xl font-bold">{userData.xp}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs md:text-sm font-medium">COINS</span>
            <span className="text-xl md:text-2xl">🪙</span>
          </div>
          <p className="text-3xl md:text-4xl font-bold">{userData.coins}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 border border-slate-600"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-xs md:text-sm font-medium">BADGES</span>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl md:text-4xl font-bold">{userData.badges?.length || 0}</p>
        </motion.div>
      </div>

      {/* Podium Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-10 md:mt-14 mb-8"
      >
        <h2 className="text-2xl font-bold mb-6 md:mb-8">🏆 Klub Reytingi</h2>

        {/* Podium */}
        <div className="flex items-end justify-center gap-2 md:gap-4 mb-10 md:mb-12">
          {[2, 1, 3].map((position) => {
            const member = podium.find((m: any) => m.rank === position);
            if (!member) return null;

            return (
              <motion.div
                key={position}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + position * 0.1 }}
                className="flex flex-col items-center"
              >
                <motion.div
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-4xl md:text-5xl mb-3"
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
                  <p className="text-2xl md:text-3xl font-bold">{position}</p>
                </div>

                <div className="text-center mt-4 w-20 md:w-28">
                  <p className="text-sm md:text-base font-semibold truncate">{member.name}</p>
                  <p className="text-xs md:text-sm text-slate-400">L{member.level}</p>
                  <p className="text-xs text-blue-400 font-bold">{member.xp} XP</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Remaining leaderboard (4th place and below) */}
        <div className="space-y-2 md:space-y-3">
          {remainingLeaderboard.map((member: any, index: number) => (
            <motion.div
              key={member.rank}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.05 }}
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
