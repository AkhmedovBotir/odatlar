'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

export default function ClubTasks({ userData, updateUserData, addReward }: any) {
  const handleTaskToggle = (taskId: string) => {
    const updatedTasks = userData.clubTasks.map((t: any) => {
      if (t.id === taskId && !t.completed) {
        addReward(t.xpReward, 'xp');
        return { ...t, completed: true };
      }
      return t;
    });

    const xpGain = userData.clubTasks.find((t: any) => t.id === taskId)?.completed
      ? 0
      : userData.clubTasks.find((t: any) => t.id === taskId)?.xpReward || 0;

    updateUserData({
      clubTasks: updatedTasks,
      xp: userData.xp + xpGain,
      coins: userData.coins + (xpGain > 0 ? Math.floor(xpGain / 10) : 0),
    });
  };

  const completedCount = userData.clubTasks.filter((t: any) => t.completed).length;
  const totalXpReward = userData.clubTasks.reduce((sum: number, t: any) => sum + (t.completed ? t.xpReward : 0), 0);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">⚡ Klub Topshiriqlari</h1>
        <p className="text-sm md:text-base text-slate-400">Klubning missiyalariga erisish uchun qatnashish</p>
      </div>

      {/* Progress Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">Bajarilgan</p>
          <p className="text-3xl md:text-4xl font-bold text-green-400">{completedCount}/{userData.clubTasks.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">Olingan XP</p>
          <p className="text-3xl md:text-4xl font-bold text-yellow-400">{totalXpReward}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
        >
          <p className="text-slate-400 text-xs md:text-sm font-medium mb-2">Qolgan</p>
          <p className="text-3xl md:text-4xl font-bold text-blue-400">
            {userData.clubTasks.filter((t: any) => !t.completed).length}
          </p>
        </motion.div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4 md:space-y-4">
        {/* Completed Tasks */}
        {userData.clubTasks.filter((t: any) => t.completed).length > 0 && (
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-3 text-green-400">✓ Bajarilgan</h3>
            <div className="space-y-2 md:space-y-3">
              {userData.clubTasks
                .filter((t: any) => t.completed)
                .map((task: any, index: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-3 md:p-5 border border-green-500/30 hover:border-green-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                        <CheckCircle2 className="w-5 md:w-6 h-5 md:h-6 text-green-500 fill-green-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="line-through text-slate-500 text-sm md:text-base truncate">{task.text}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                        <span className="text-green-400 font-bold text-xs md:text-sm whitespace-nowrap">+{task.xpReward} XP</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}

        {/* Incomplete Tasks */}
        {userData.clubTasks.filter((t: any) => !t.completed).length > 0 && (
          <div>
            <h3 className="text-base md:text-lg font-semibold mb-3 text-blue-400">○ Bajarilmagan</h3>
            <div className="space-y-2 md:space-y-3">
              {userData.clubTasks
                .filter((t: any) => !t.completed)
                .map((task: any, index: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay:
                        userData.clubTasks.filter((t: any) => t.completed).length * 0.1 + index * 0.1,
                    }}
                    onClick={() => handleTaskToggle(task.id)}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-3 md:p-5 border border-slate-600 hover:border-slate-500 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-500/10 active:scale-95"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTaskToggle(task.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <Circle className="w-5 md:w-6 h-5 md:h-6 text-slate-500 hover:text-slate-400 transition-colors" />
                        </motion.button>
                        <p className="text-white font-medium text-sm md:text-base truncate">{task.text}</p>
                      </div>
                      <div className="flex items-center gap-2 md:gap-3 ml-2 flex-shrink-0">
                        <motion.div
                          className="bg-slate-700/50 rounded-lg px-2 md:px-3 py-1"
                          whileHover={{ scale: 1.05 }}
                        >
                          <span className="text-yellow-400 font-bold text-xs md:text-sm whitespace-nowrap">{task.xpReward} XP</span>
                        </motion.div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Motivation Section */}
      {completedCount === userData.clubTasks.length && userData.clubTasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 md:mt-8 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 md:p-6 border border-green-500/30 text-center"
        >
          <h3 className="text-xl md:text-2xl font-bold text-green-400 mb-2">🎉 Ajoyib!</h3>
          <p className="text-sm md:text-base text-slate-300">Siz barcha topshiriqlari bajardiniz! Klub sizga minnatdor.</p>
        </motion.div>
      )}
    </div>
  );
}
