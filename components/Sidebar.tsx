import { motion } from 'framer-motion';
import { BarChart3, CheckCircle, Brain, Zap } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }: any) {
  const tabs = [
    { id: 'dashboard', label: 'Boshqaruv paneli', icon: BarChart3 },
    { id: 'goodHabits', label: 'Yaxshi Odatlar', icon: CheckCircle },
    { id: 'dominants', label: 'Dominanta', icon: Brain },
    { id: 'clubTasks', label: 'Klub Topshiriqlari', icon: Zap },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 flex flex-col p-6 gap-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-lg">
          🎯
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Odatlar Klub
        </h1>
      </div>

      <nav className="flex flex-col gap-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
}
