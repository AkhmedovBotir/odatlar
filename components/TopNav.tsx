import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface TopNavProps {
  activeTab: string;
  showModal: boolean;
  setShowModal: (show: boolean) => void;
}

export default function TopNav({ activeTab, showModal, setShowModal }: TopNavProps) {
  const getTitle = () => {
    switch (activeTab) {
      case 'home':
        return 'Bosh Sahifa';
      case 'statistics':
        return 'Statistika';
      case 'goodHabits':
        return 'Yaxshi Odatlar';
      case 'dominants':
        return 'Dominanta Mashqlari';
      default:
        return 'Odatlar Klub';
    }
  };

  return (
    <motion.div
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="bg-gradient-to-r from-slate-800 to-slate-700 border-b border-slate-600 px-4 md:px-8 py-4"
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showModal && (
            <motion.button
              onClick={() => setShowModal(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-blue-400" />
            </motion.button>
          )}
          <h1 className="text-2xl md:text-3xl font-bold">{getTitle()}</h1>
        </div>
        <div className="text-sm md:text-base text-slate-400">
          {new Date().toLocaleDateString('uz-UZ', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })}
        </div>
      </div>
    </motion.div>
  );
}
