'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play } from 'lucide-react';

export default function Timer({
  duration,
  onComplete,
  type,
  prosList,
  consList,
  notes,
}: any) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className="flex flex-col items-center justify-center gap-4 md:gap-6">
      {/* Circular Progress */}
      <motion.div
        className="relative w-32 md:w-48 h-32 md:h-48 flex items-center justify-center flex-shrink-0"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="rgba(100, 116, 139, 0.3)"
            strokeWidth="8"
          />
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - progress / 100)}`}
            transition={{ duration: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#9333ea" />
            </linearGradient>
          </defs>
        </svg>

        {/* Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            key={timeLeft}
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.div>
          <p className="text-xs md:text-sm text-slate-400 mt-1 md:mt-2 whitespace-nowrap">
            {type === 'fikrlash' ? '🤔 Fikrlash' : '📚 O\'qish'}
          </p>
        </div>
      </motion.div>

      {/* Control Buttons */}
      <div className="flex gap-3 md:gap-4">
        <motion.button
          onClick={() => setIsRunning(!isRunning)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-full p-3 md:p-4 transition-all"
        >
          {isRunning ? (
            <Pause className="w-5 md:w-6 h-5 md:h-6" />
          ) : (
            <Play className="w-5 md:w-6 h-5 md:h-6" />
          )}
        </motion.button>
      </div>

      {/* Summary */}
      {type === 'fikrlash' && (prosList.length > 0 || consList.length > 0) && (
        <div className="w-full bg-slate-700/50 rounded-lg p-3 md:p-4 mt-3 md:mt-4">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div>
              <p className="text-xs text-green-400 font-semibold mb-1 md:mb-2">PLUSLARI</p>
              <p className="text-lg md:text-xl font-bold">{prosList.length}</p>
            </div>
            <div>
              <p className="text-xs text-red-400 font-semibold mb-1 md:mb-2">MINUSLARI</p>
              <p className="text-lg md:text-xl font-bold">{consList.length}</p>
            </div>
          </div>
        </div>
      )}

      {type === 'ma\'lumot' && notes && (
        <div className="w-full bg-slate-700/50 rounded-lg p-3 md:p-4 mt-3 md:mt-4 max-h-24 md:max-h-32 overflow-y-auto">
          <p className="text-xs text-blue-400 font-semibold mb-2">YOZUVLAR</p>
          <p className="text-xs md:text-sm text-slate-300 break-words">{notes}</p>
        </div>
      )}
    </div>
  );
}
