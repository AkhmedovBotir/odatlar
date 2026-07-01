'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Plus, X } from 'lucide-react';
import Timer from '@/components/Timer';

export default function Dominants({ userData, updateUserData, addReward }: any) {
  const [timerActive, setTimerActive] = useState(false);
  const [timerType, setTimerType] = useState<'fikrlash' | 'ma\'lumot' | null>(null);
  const [notes, setNotes] = useState('');
  const [prosList, setProsList] = useState<string[]>([]);
  const [consList, setConsList] = useState<string[]>([]);
  const [currentPro, setCurrentPro] = useState('');
  const [currentCon, setCurrentCon] = useState('');

  const handleTimerComplete = () => {
    if (timerType === 'fikrlash') {
      const newDominant = {
        id: `dom_${Date.now()}`,
        title: 'Yangi Dominanta',
        type: 'fikrlash',
        cue: 'Belgilangan',
        reward: 'Topilmagan',
        pros: prosList,
        cons: consList,
        sessionsCompleted: 1,
      };
      updateUserData({
        dominants: [...userData.dominants, newDominant],
        xp: userData.xp + 100,
      });
    } else if (timerType === 'ma\'lumot') {
      updateUserData({
        xp: userData.xp + 100,
      });
    }

    addReward(100, 'xp');
    setTimerActive(false);
    setTimerType(null);
    setNotes('');
    setProsList([]);
    setConsList([]);
    setCurrentPro('');
    setCurrentCon('');
  };

  const addPro = () => {
    if (currentPro.trim()) {
      setProsList([...prosList, currentPro]);
      setCurrentPro('');
    }
  };

  const addCon = () => {
    if (currentCon.trim()) {
      setConsList([...consList, currentCon]);
      setCurrentCon('');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">🧠 Dominanta Mashqlari</h1>
        <p className="text-sm md:text-base text-slate-400">Ukhtomskiy prinsipi bo'yicha fikrlash o'zgartiring</p>
      </div>

      {/* Timer Section */}
      {timerActive && timerType && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8 bg-gradient-to-br from-blue-900/50 to-purple-900/50 rounded-lg p-4 md:p-8 border border-blue-500/50 overflow-y-auto max-h-[75vh] md:max-h-none"
        >
          <Timer
            duration={600} // 10 minutes
            onComplete={handleTimerComplete}
            type={timerType}
            prosList={prosList}
            consList={consList}
            notes={notes}
          />

          {/* Pro/Con Input for Fikrlash */}
          {timerType === 'fikrlash' && (
            <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Plus ➕</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentPro}
                    onChange={(e) => setCurrentPro(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addPro()}
                    placeholder="Foydasini yozing..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={addPro}
                    className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-all flex-shrink-0"
                  >
                    <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  </button>
                </div>
              </div>

              {prosList.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 max-h-24 md:max-h-none overflow-y-auto">
                  {prosList.map((pro, idx) => (
                    <div key={idx} className="flex items-center justify-between text-green-400 text-sm">
                      <span className="truncate">✓ {pro}</span>
                      <button
                        onClick={() => setProsList(prosList.filter((_, i) => i !== idx))}
                        className="hover:text-red-400 transition-colors flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs md:text-sm font-medium mb-2">Minus ➖</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentCon}
                    onChange={(e) => setCurrentCon(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && addCon()}
                    placeholder="Zarorini yozing..."
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 md:px-4 py-2 text-sm md:text-base text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                  />
                  <button
                    onClick={addCon}
                    className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-all flex-shrink-0"
                  >
                    <Plus className="w-4 md:w-5 h-4 md:h-5" />
                  </button>
                </div>
              </div>

              {consList.length > 0 && (
                <div className="bg-slate-700/50 rounded-lg p-3 space-y-2 max-h-24 md:max-h-none overflow-y-auto">
                  {consList.map((con, idx) => (
                    <div key={idx} className="flex items-center justify-between text-red-400 text-sm">
                      <span className="truncate">✗ {con}</span>
                      <button
                        onClick={() => setConsList(consList.filter((_, i) => i !== idx))}
                        className="hover:text-red-300 transition-colors flex-shrink-0 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes for Ma'lumot */}
          {timerType === 'ma\'lumot' && (
            <div className="mt-6 md:mt-8">
              <label className="block text-xs md:text-sm font-medium mb-2">Yozuvlar</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="O'rgangan ma'lumotlarni yozing..."
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none h-20 md:h-24"
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Start Timer Buttons */}
      {!timerActive && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <motion.button
            onClick={() => {
              setTimerActive(true);
              setTimerType('fikrlash');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg p-4 md:p-8 text-left transition-all border border-blue-500/30 active:scale-95"
          >
            <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">🤔 Fikrlash orqali</h3>
            <p className="text-blue-200 text-xs md:text-sm mb-3 md:mb-4">10 daqiqalik fikrlash sessiyasi</p>
            <div className="flex items-center gap-2 text-blue-300 text-sm md:text-base">
              <Play className="w-4 md:w-5 h-4 md:h-5" />
              <span className="font-semibold">Boshlash</span>
            </div>
          </motion.button>

          <motion.button
            onClick={() => {
              setTimerActive(true);
              setTimerType('ma\'lumot');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg p-4 md:p-8 text-left transition-all border border-purple-500/30 active:scale-95"
          >
            <h3 className="text-xl md:text-2xl font-bold mb-1 md:mb-2">📚 Ma'lumot orqali</h3>
            <p className="text-purple-200 text-xs md:text-sm mb-3 md:mb-4">10 daqiqalik o'qish/izlanish sessiyasi</p>
            <div className="flex items-center gap-2 text-purple-300 text-sm md:text-base">
              <Play className="w-4 md:w-5 h-4 md:h-5" />
              <span className="font-semibold">Boshlash</span>
            </div>
          </motion.button>
        </div>
      )}

      {/* Existing Dominants */}
      {userData.dominants.length > 0 && (
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-4">📊 Yaratilgan Dominantalar</h2>
          <div className="space-y-3 md:space-y-4">
            {userData.dominants.map((dominant: any, index: number) => (
              <motion.div
                key={dominant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-4 md:p-6 border border-slate-600"
              >
                <h3 className="text-lg md:text-xl font-bold mb-3 md:mb-4 break-words">{dominant.title}</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                  <div>
                    <p className="text-xs md:text-sm text-slate-400 mb-1 md:mb-2">Tip</p>
                    <p className="text-sm md:text-base font-semibold">{dominant.type === 'fikrlash' ? '🤔 Fikrlash' : '📚 Ma\'lumot'}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-sm text-slate-400 mb-1 md:mb-2">Sessiyalar</p>
                    <p className="text-sm md:text-base font-semibold">{dominant.sessionsCompleted}</p>
                  </div>
                </div>

                {dominant.pros.length > 0 && (
                  <div className="mb-3 md:mb-3">
                    <p className="text-xs md:text-sm text-green-400 mb-1 md:mb-2 font-semibold">Pluslari:</p>
                    <div className="space-y-1">
                      {dominant.pros.map((pro: string, idx: number) => (
                        <p key={idx} className="text-xs md:text-sm text-slate-300 break-words">✓ {pro}</p>
                      ))}
                    </div>
                  </div>
                )}

                {dominant.cons.length > 0 && (
                  <div>
                    <p className="text-xs md:text-sm text-red-400 mb-1 md:mb-2 font-semibold">Minuslari:</p>
                    <div className="space-y-1">
                      {dominant.cons.map((con: string, idx: number) => (
                        <p key={idx} className="text-xs md:text-sm text-slate-300 break-words">✗ {con}</p>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
