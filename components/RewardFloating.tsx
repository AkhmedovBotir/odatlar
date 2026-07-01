import { motion } from 'framer-motion';
import { Star, Zap } from 'lucide-react';

export default function RewardFloating({ amount, type }: { amount: number; type: string }) {
  const randomX = Math.random() * 300 - 150;
  const randomY = Math.random() * 200 - 100;

  return (
    <motion.div
      initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      animate={{ opacity: 0, x: randomX, y: -200, scale: 0.5 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
    >
      <div className="flex items-center gap-2 font-bold text-lg">
        {type === 'xp' ? (
          <>
            <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-400">+{amount} XP</span>
          </>
        ) : (
          <>
            <Zap className="w-6 h-6 fill-blue-400 text-blue-400" />
            <span className="text-blue-400">+{amount}</span>
          </>
        )}
      </div>
    </motion.div>
  );
}
