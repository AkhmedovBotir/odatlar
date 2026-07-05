'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Brain, Flame, ChevronRight } from 'lucide-react';

const actions = [
  {
    href: '/odatlar',
    icon: Flame,
    label: 'Odatlar',
    desc: 'Amaliyotlar',
    gradient: 'from-emerald-950/50 to-slate-900',
    border: 'border-emerald-800/40',
    accent: 'text-emerald-400',
    ring: 'ring-emerald-500/30',
  },
  {
    href: '/dominantalar',
    icon: Brain,
    label: 'Dominantalar',
    desc: 'Mashqlar',
    gradient: 'from-violet-950/50 to-slate-900',
    border: 'border-violet-800/40',
    accent: 'text-violet-400',
    ring: 'ring-violet-500/30',
  },
  {
    href: '/statistika',
    icon: BarChart3,
    label: 'Statistika',
    desc: 'Reyting',
    gradient: 'from-blue-950/50 to-slate-900',
    border: 'border-blue-800/40',
    accent: 'text-blue-400',
    ring: 'ring-blue-500/30',
  },
  {
    href: '/qollanma',
    icon: BookOpen,
    label: "Qo'llanma",
    desc: 'Kurslar',
    gradient: 'from-amber-950/40 to-slate-900',
    border: 'border-amber-800/40',
    accent: 'text-amber-400',
    ring: 'ring-amber-500/30',
  },
];

export default function HomeQuickActions() {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.div
            key={action.href}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <Link
              href={action.href}
              className={`group flex flex-col items-center rounded-2xl border bg-gradient-to-br px-3 py-3.5 text-center transition-all hover:brightness-110 ${action.border} ${action.gradient}`}
            >
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/60 ring-2 ${action.ring}`}
              >
                <Icon className={`h-5 w-5 ${action.accent}`} strokeWidth={1.75} />
              </div>
              <p className="text-xs font-bold text-white">{action.label}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{action.desc}</p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
