import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, CheckCircle2, Circle, ChevronDown, X } from 'lucide-react';

interface GoodHabitsProps {
  userData: any;
  updateUserData: (updates: any) => void;
  addReward: (amount: number, type: string) => void;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export default function GoodHabits({
  userData,
  updateUserData,
  addReward,
  showModal,
  setShowModal,
}: GoodHabitsProps) {
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    benefits: [''],
  });

  const totalHabitsCompleted = userData.goodHabits.filter((h: any) => h.completedToday).length;
  const totalHabits = userData.goodHabits.length;
  const incompleteHabits = totalHabits - totalHabitsCompleted;

  const handleHabitToggle = (habitId: string) => {
    const updated = userData.goodHabits.map((h: any) => {
      if (h.id === habitId) {
        const newStreak = !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1);
        const xpReward = !h.completedToday ? 50 : -25;
        addReward(xpReward, 'xp');
        return {
          ...h,
          completedToday: !h.completedToday,
          streak: newStreak,
        };
      }
      return h;
    });

    updateUserData({
      ...userData,
      goodHabits: updated,
      xp: userData.xp + (50 || -25),
    });
  };

  const openEditModal = (habit?: any) => {
    if (habit) {
      setEditingHabit(habit);
      setFormData({
        name: habit.name,
        benefits: habit.benefits || [''],
      });
    } else {
      setEditingHabit(null);
      setFormData({
        name: '',
        benefits: [''],
      });
    }
    setShowModal(true);
  };

  const saveHabit = () => {
    if (!formData.name.trim()) return;

    const benefits = formData.benefits.filter((b: string) => b.trim());

    if (editingHabit) {
      const updated = userData.goodHabits.map((h: any) =>
        h.id === editingHabit.id
          ? { ...h, name: formData.name, benefits }
          : h
      );
      updateUserData({ ...userData, goodHabits: updated });
    } else {
      const newHabit = {
        id: Date.now().toString(),
        name: formData.name,
        benefits,
        completedToday: false,
        streak: 0,
      };
      updateUserData({
        ...userData,
        goodHabits: [...userData.goodHabits, newHabit],
      });
    }

    setShowModal(false);
    setEditingHabit(null);
    setFormData({ name: '', benefits: [''] });
  };

  const deleteHabit = (habitId: string) => {
    const updated = userData.goodHabits.filter((h: any) => h.id !== habitId);
    updateUserData({ ...userData, goodHabits: updated });
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen pb-24">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-gradient-to-br from-green-900/40 to-green-800/20 rounded-lg p-3 md:p-6 border border-green-500/30"
        >
          <p className="text-xs md:text-sm text-green-300 font-medium mb-2">BUGUN BAJARILGAN</p>
          <p className="text-2xl md:text-4xl font-bold text-green-400">{totalHabitsCompleted}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 rounded-lg p-3 md:p-6 border border-blue-500/30"
        >
          <p className="text-xs md:text-sm text-blue-300 font-medium mb-2">UMUMIY ODATLAR</p>
          <p className="text-2xl md:text-4xl font-bold text-blue-400">{totalHabits}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-900/40 to-orange-800/20 rounded-lg p-3 md:p-6 border border-orange-500/30"
        >
          <p className="text-xs md:text-sm text-orange-300 font-medium mb-2">BAJARILMAGAN</p>
          <p className="text-2xl md:text-4xl font-bold text-orange-400">{incompleteHabits}</p>
        </motion.div>
      </div>

      {/* Add Button */}
      <motion.button
        onClick={() => openEditModal()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg p-3 md:p-4 font-semibold mb-6 flex items-center justify-center gap-2 transition-all"
      >
        <Plus className="w-5 h-5" />
        Yangi odatni qo'sh
      </motion.button>

      {/* Habits List */}
      <div className="space-y-3 md:space-y-4">
        {userData.goodHabits.map((habit: any, index: number) => (
          <motion.div
            key={habit.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-slate-600 overflow-hidden hover:border-slate-500 transition-all"
          >
            <div
              onClick={() => setExpandedHabit(expandedHabit === habit.id ? null : habit.id)}
              className="p-3 md:p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleHabitToggle(habit.id);
                    }}
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {habit.completedToday ? (
                      <CheckCircle2 className="w-6 md:w-8 h-6 md:h-8 text-green-500 fill-green-500" />
                    ) : (
                      <Circle className="w-6 md:w-8 h-6 md:h-8 text-slate-500 hover:text-slate-400" />
                    )}
                  </motion.button>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm md:text-lg font-semibold transition-all truncate ${
                        habit.completedToday ? 'line-through text-slate-500' : 'text-white'
                      }`}
                    >
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs md:text-sm text-slate-400 truncate">
                        Streyk: {habit.streak} kun
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(habit);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-blue-400" />
                  </motion.button>
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteHabit(habit.id);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </motion.button>
                  <motion.div
                    animate={{ rotate: expandedHabit === habit.id ? 180 : 0 }}
                    className="ml-2 md:ml-4 flex-shrink-0"
                  >
                    <ChevronDown className="w-4 md:w-5 h-4 md:h-5 text-slate-400" />
                  </motion.div>
                </div>
              </div>
            </div>

            {/* Benefits - Expandable */}
            <AnimatePresence>
              {expandedHabit === habit.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-slate-600 bg-slate-700/50 p-3 md:p-6"
                >
                  <h4 className="font-semibold text-xs md:text-sm text-slate-300 mb-3 md:mb-4 uppercase tracking-wide">
                    Foydalari:
                  </h4>
                  <div className="space-y-2">
                    {habit.benefits && habit.benefits.length > 0 ? (
                      habit.benefits.map((benefit: string, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start gap-2 md:gap-3 text-slate-300"
                        >
                          <span className="text-blue-400 font-bold mt-0.5 flex-shrink-0">✓</span>
                          <span className="text-xs md:text-sm break-words">{benefit}</span>
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-xs md:text-sm text-slate-400">Foydalari kiritilmagan</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 max-w-md w-full border border-slate-600 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingHabit ? 'Odatni tahrirlash' : 'Yangi odatni qo\'sh'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Odatning nomi</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Masalan: Suv ichish"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Foydalari</label>
                  <div className="space-y-2">
                    {formData.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...formData.benefits];
                            newBenefits[idx] = e.target.value;
                            setFormData({ ...formData, benefits: newBenefits });
                          }}
                          placeholder="Foydasini yozing..."
                          className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                        />
                        {formData.benefits.length > 1 && (
                          <button
                            onClick={() => {
                              const newBenefits = formData.benefits.filter((_, i) => i !== idx);
                              setFormData({ ...formData, benefits: newBenefits });
                            }}
                            className="p-2 hover:bg-slate-700 rounded text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, benefits: [...formData.benefits, ''] })}
                    className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Foyda qo'sh
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveHabit}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg py-2 font-semibold transition-all"
                  >
                    Saqlash
                  </button>
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg py-2 font-semibold transition-all"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
