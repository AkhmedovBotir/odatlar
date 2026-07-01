'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopNav from '@/components/TopNav';
import BottomNav from '@/components/BottomNav';
import Home from '@/components/tabs/Home';
import Statistics from '@/components/tabs/Statistics';
import GoodHabits from '@/components/tabs/GoodHabits';
import Dominants from '@/components/tabs/Dominants';
import RewardFloating from '@/components/RewardFloating';

export default function Page() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [userData, setUserData] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Load mockup data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/mockup.json');
        const data = await response.json();
        const savedData = localStorage.getItem('clubAppData');
        const mergedData = {
          name: data.user.name,
          level: data.user.level,
          xp: data.user.xp,
          nextLevelXp: data.user.nextLevelXp,
          coins: data.user.coins,
          badges: data.user.badges,
          goodHabits: data.goodHabits,
          dominants: data.dominants,
          clubTasks: data.clubTasks,
          leaderboard: data.leaderboard,
        };
        if (savedData) {
          const parsed = JSON.parse(savedData);
          const updatedData = { ...parsed, leaderboard: data.leaderboard };
          setUserData(updatedData);
          localStorage.setItem('clubAppData', JSON.stringify(updatedData));
        } else {
          setUserData(mergedData);
          localStorage.setItem('clubAppData', JSON.stringify(mergedData));
        }
      } catch (error) {
        console.error('Error loading mockup data:', error);
      }
    };
    loadData();
  }, []);

  const addReward = (amount: number, type: string = 'xp') => {
    const id = Date.now();
    setRewards(prev => [...prev, { id, amount, type }]);
    setTimeout(() => {
      setRewards(prev => prev.filter(r => r.id !== id));
    }, 1500);
  };

  const updateUserData = (updates: any) => {
    const newData = { ...userData, ...updates };
    setUserData(newData);
    localStorage.setItem('clubAppData', JSON.stringify(newData));
  };

  if (!userData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden flex flex-col">
      {/* Top Navigation */}
      <TopNav activeTab={activeTab} showModal={showModal} setShowModal={setShowModal} />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Home userData={userData} addReward={addReward} />
            </motion.div>
          )}
          {activeTab === 'statistics' && (
            <motion.div
              key="statistics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Statistics userData={userData} />
            </motion.div>
          )}
          {activeTab === 'goodHabits' && (
            <motion.div
              key="goodHabits"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <GoodHabits 
                userData={userData} 
                updateUserData={updateUserData} 
                addReward={addReward}
                showModal={showModal}
                setShowModal={setShowModal}
              />
            </motion.div>
          )}
          {activeTab === 'dominants' && (
            <motion.div
              key="dominants"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Dominants userData={userData} updateUserData={updateUserData} addReward={addReward} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Floating Rewards */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {rewards.map(reward => (
          <RewardFloating key={reward.id} amount={reward.amount} type={reward.type} />
        ))}
      </div>
    </div>
  );
}
