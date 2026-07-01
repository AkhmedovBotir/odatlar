import { motion } from 'framer-motion';
import { Home, BarChart3, Flame, Brain } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'home', icon: Home, label: 'Bosh' },
    { id: 'statistics', icon: BarChart3, label: 'Statistika' },
    { id: 'goodHabits', icon: Flame, label: 'Odatlar' },
    { id: 'dominants', icon: Brain, label: 'Dominantal' },
  ];

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="border-t border-slate-700/50 bg-gradient-to-t from-slate-900 via-slate-900 to-slate-850 px-4 md:px-8 py-4 md:py-5 backdrop-blur-lg"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-1 md:gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center justify-center py-2 md:py-3 px-3 md:px-5 transition-all"
              >
                {/* Background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-blue-500/30"
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    color: isActive ? '#60a5fa' : '#94a3b8',
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  <Icon className="w-6 md:w-7 h-6 md:h-7" />
                </motion.div>

                {/* Label */}
                <motion.span
                  animate={{
                    opacity: isActive ? 1 : 0.6,
                    color: isActive ? '#93c5fd' : '#cbd5e1',
                  }}
                  transition={{ duration: 0.2 }}
                  className="text-xs md:text-sm font-semibold mt-1 relative z-10"
                >
                  {tab.label}
                </motion.span>

                {/* Bottom Underline */}
                {isActive && (
                  <motion.div
                    layoutId="activeUnderline"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 md:w-10 h-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
