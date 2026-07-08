'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useNavigation } from '@/components/NavigationProvider';

export default function NavigationLoader() {
  const { isNavigating } = useNavigation();

  return (
    <>
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[100]"
          >
            <div className="h-0.5 w-full overflow-hidden bg-slate-800/80">
              <motion.div
                className="h-full w-1/3 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500"
                animate={{ x: ['-100%', '400%'] }}
                transition={{ duration: 1, ease: 'linear', repeat: Infinity }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px]"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
              className="h-10 w-10 rounded-full border-[3px] border-blue-500 border-t-transparent shadow-lg shadow-blue-900/30"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
