'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Brain, Zap, Gift, Play, ArrowLeft, Trash2 } from 'lucide-react';
import Timer from '@/components/Timer';

type SessionType = 'fikrlash' | 'ma\'lumot';
type View = 'list' | 'setup' | 'pickType' | 'session';

interface DominantsProps {
  userData: any;
  updateUserData: (updates: any) => void;
  addReward: (amount: number, type: string) => void;
}

const emptyForm = { title: '', cue: '', reward: '' };

export default function Dominants({ userData, updateUserData, addReward }: DominantsProps) {
  const [view, setView] = useState<View>('list');
  const [activeDominant, setActiveDominant] = useState<any | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [sessionType, setSessionType] = useState<SessionType | null>(null);
  const [notes, setNotes] = useState('');
  const [prosList, setProsList] = useState<string[]>([]);
  const [consList, setConsList] = useState<string[]>([]);
  const [currentPro, setCurrentPro] = useState('');
  const [currentCon, setCurrentCon] = useState('');

  const totalSessions = userData.dominants.reduce(
    (sum: number, d: any) => sum + (d.sessionsCompleted || 0),
    0
  );

  const resetSession = () => {
    setNotes('');
    setProsList([]);
    setConsList([]);
    setCurrentPro('');
    setCurrentCon('');
    setSessionType(null);
  };

  const goToList = () => {
    setView('list');
    setActiveDominant(null);
    setFormData(emptyForm);
    resetSession();
  };

  const startNewDominant = () => {
    setActiveDominant(null);
    setFormData(emptyForm);
    resetSession();
    setView('setup');
  };

  const startPractice = (dominant: any) => {
    setActiveDominant(dominant);
    resetSession();
    setView('pickType');
  };

  const handleSetupContinue = () => {
    if (!formData.title.trim() || !formData.cue.trim() || !formData.reward.trim()) return;
    setView('pickType');
  };

  const beginSession = (type: SessionType) => {
    setSessionType(type);
    setView('session');
  };

  const handleTimerComplete = () => {
    if (!sessionType) return;

    if (activeDominant) {
      const updated = userData.dominants.map((d: any) =>
        d.id === activeDominant.id
          ? {
              ...d,
              sessionsCompleted: (d.sessionsCompleted || 0) + 1,
              pros: sessionType === 'fikrlash' ? [...d.pros, ...prosList] : d.pros,
              cons: sessionType === 'fikrlash' ? [...d.cons, ...consList] : d.cons,
              notes: sessionType === 'ma\'lumot' && notes ? notes : d.notes,
            }
          : d
      );
      updateUserData({ dominants: updated, xp: userData.xp + 100 });
    } else {
      const newDominant = {
        id: `dom_${Date.now()}`,
        title: formData.title.trim(),
        cue: formData.cue.trim(),
        reward: formData.reward.trim(),
        type: sessionType,
        pros: prosList,
        cons: consList,
        notes: sessionType === 'ma\'lumot' ? notes : '',
        sessionsCompleted: 1,
      };
      updateUserData({
        dominants: [...userData.dominants, newDominant],
        xp: userData.xp + 100,
      });
    }

    addReward(100, 'xp');
    goToList();
  };

  const deleteDominant = (id: string) => {
    updateUserData({
      dominants: userData.dominants.filter((d: any) => d.id !== id),
    });
  };

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

  const sessionTitle = activeDominant?.title ?? formData.title;
  const sessionCue = activeDominant?.cue ?? formData.cue;
  const sessionReward = activeDominant?.reward ?? formData.reward;
  const setupValid =
    formData.title.trim() && formData.cue.trim() && formData.reward.trim();

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-24 md:pb-8">
      <AnimatePresence mode="wait">
        {/* ── LIST VIEW ── */}
        {view === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
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
                <p className="text-2xl md:text-3xl font-bold text-purple-300">
                  {userData.dominants.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-4 border border-blue-500/30">
                <p className="text-xs text-blue-300 mb-1">Jami sessiyalar</p>
                <p className="text-2xl md:text-3xl font-bold text-blue-300">{totalSessions}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg md:text-xl font-bold">Mening dominantalarim</h2>
              <motion.button
                onClick={startNewDominant}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg px-3 md:px-4 py-2 text-sm font-semibold transition-all"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Yangi dominanta</span>
                <span className="sm:hidden">Qo&apos;shish</span>
              </motion.button>
            </div>

            {userData.dominants.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 rounded-xl p-8 md:p-12 border border-dashed border-slate-600 text-center"
              >
                <Brain className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">
                  Hali dominanta qo&apos;shilmagan. Birinchi zararli odatni aniqlang va mashq
                  qiling.
                </p>
                <button
                  onClick={startNewDominant}
                  className="bg-purple-600 hover:bg-purple-500 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all"
                >
                  Birinchi dominantani yaratish
                </button>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {userData.dominants.map((dominant: any, index: number) => (
                  <motion.div
                    key={dominant.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-4 md:p-6 border border-slate-600"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <h3 className="text-lg md:text-xl font-bold break-words flex-1">
                        {dominant.title}
                      </h3>
                      <button
                        onClick={() => deleteDominant(dominant.id)}
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

                    {(dominant.pros?.length > 0 || dominant.cons?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-xs md:text-sm">
                        {dominant.pros?.length > 0 && (
                          <div className="bg-slate-900/40 rounded-lg p-3">
                            <p className="text-green-400 font-semibold mb-1">Foydalari</p>
                            {dominant.pros.slice(0, 3).map((pro: string, i: number) => (
                              <p key={i} className="text-slate-300 truncate">
                                ✓ {pro}
                              </p>
                            ))}
                            {dominant.pros.length > 3 && (
                              <p className="text-slate-500 mt-1">+{dominant.pros.length - 3} ta</p>
                            )}
                          </div>
                        )}
                        {dominant.cons?.length > 0 && (
                          <div className="bg-slate-900/40 rounded-lg p-3">
                            <p className="text-red-400 font-semibold mb-1">Zararlari</p>
                            {dominant.cons.slice(0, 3).map((con: string, i: number) => (
                              <p key={i} className="text-slate-300 truncate">
                                ✗ {con}
                              </p>
                            ))}
                            {dominant.cons.length > 3 && (
                              <p className="text-slate-500 mt-1">+{dominant.cons.length - 3} ta</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {dominant.notes && (
                      <div className="bg-slate-900/40 rounded-lg p-3 mb-4 text-xs md:text-sm">
                        <p className="text-blue-400 font-semibold mb-1">Yozuvlar</p>
                        <p className="text-slate-300 line-clamp-2">{dominant.notes}</p>
                      </div>
                    )}

                    <button
                      onClick={() => startPractice(dominant)}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-500 rounded-lg py-2.5 text-sm font-semibold transition-all"
                    >
                      <Play className="w-4 h-4" />
                      Mashq qilish
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ── SETUP VIEW (new dominant) ── */}
        {view === 'setup' && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={goToList}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </button>

            <h2 className="text-xl md:text-2xl font-bold mb-2">Yangi dominanta</h2>
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
                onClick={handleSetupContinue}
                disabled={!setupValid}
                whileHover={{ scale: setupValid ? 1.02 : 1 }}
                whileTap={{ scale: setupValid ? 0.98 : 1 }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed rounded-lg py-3 font-semibold transition-all"
              >
                Davom etish
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── PICK TYPE VIEW ── */}
        {view === 'pickType' && (
          <motion.div
            key="pickType"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <button
              onClick={() => (activeDominant ? goToList() : setView('setup'))}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Orqaga
            </button>

            <div className="bg-slate-800/60 rounded-xl p-4 mb-6 border border-slate-600">
              <p className="text-lg font-bold mb-2">{sessionTitle}</p>
              <p className="text-sm text-slate-400">
                <Zap className="w-3 h-3 inline text-yellow-400 mr-1" />
                {sessionCue}
              </p>
            </div>

            <h2 className="text-xl font-bold mb-2">Mashq usulini tanlang</h2>
            <p className="text-sm text-slate-400 mb-6">10 daqiqalik sessiya boshlanadi</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.button
                onClick={() => beginSession('fikrlash')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-xl p-6 text-left border border-blue-500/30 transition-all"
              >
                <span className="text-3xl mb-3 block">🤔</span>
                <h3 className="text-lg font-bold mb-1">Fikrlash orqali</h3>
                <p className="text-blue-200 text-sm">
                  Odatning foyda va zararlarini yozib, yangi fikrni mustahkamlang
                </p>
              </motion.button>

              <motion.button
                onClick={() => beginSession('ma\'lumot')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-xl p-6 text-left border border-purple-500/30 transition-all"
              >
                <span className="text-3xl mb-3 block">📚</span>
                <h3 className="text-lg font-bold mb-1">Ma&apos;lumot orqali</h3>
                <p className="text-purple-200 text-sm">
                  Mavzu bo&apos;yicha o&apos;qing va o&apos;rganganlaringizni yozing
                </p>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ── SESSION VIEW ── */}
        {view === 'session' && sessionType && (
          <motion.div
            key="session"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl p-4 md:p-8 border border-blue-500/30"
          >
            <button
              onClick={() => setView('pickType')}
              className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Bekor qilish
            </button>

            <div className="mb-6 pb-4 border-b border-slate-600/50">
              <p className="text-lg font-bold mb-1">{sessionTitle}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                <span>
                  <Zap className="w-3 h-3 inline text-yellow-400 mr-1" />
                  {sessionCue}
                </span>
                <span>
                  <Gift className="w-3 h-3 inline text-pink-400 mr-1" />
                  {sessionReward}
                </span>
              </div>
            </div>

            <Timer
              duration={600}
              onComplete={handleTimerComplete}
              type={sessionType}
              prosList={prosList}
              consList={consList}
              notes={notes}
            />

            {sessionType === 'fikrlash' && (
              <div className="mt-6 md:mt-8 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-green-400">
                    Foydalari ➕
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentPro}
                      onChange={(e) => setCurrentPro(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.nativeEvent.isComposing && addPro()
                      }
                      placeholder="Yangi odatning foydasini yozing..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-green-500"
                    />
                    <button
                      onClick={addPro}
                      className="bg-green-600 hover:bg-green-700 p-2 rounded-lg transition-all flex-shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {prosList.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {prosList.map((pro, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-green-400 text-sm bg-slate-800/50 rounded px-3 py-1.5"
                        >
                          <span className="truncate">✓ {pro}</span>
                          <button
                            onClick={() => setProsList(prosList.filter((_, i) => i !== idx))}
                            className="hover:text-red-400 ml-2 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-red-400">
                    Zararlari ➖
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentCon}
                      onChange={(e) => setCurrentCon(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' && !e.nativeEvent.isComposing && addCon()
                      }
                      placeholder="Eski odatning zararini yozing..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-red-500"
                    />
                    <button
                      onClick={addCon}
                      className="bg-red-600 hover:bg-red-700 p-2 rounded-lg transition-all flex-shrink-0"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {consList.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {consList.map((con, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-red-400 text-sm bg-slate-800/50 rounded px-3 py-1.5"
                        >
                          <span className="truncate">✗ {con}</span>
                          <button
                            onClick={() => setConsList(consList.filter((_, i) => i !== idx))}
                            className="hover:text-red-300 ml-2 flex-shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {sessionType === 'ma\'lumot' && (
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
