'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { mainNavTabs, isNavActive } from '@/lib/navigation';
import { useUserData } from '@/components/UserDataProvider';

export default function SideNav() {
  const pathname = usePathname();
  const { userData } = useUserData();

  return (
    <aside className="hidden lg:flex w-64 xl:w-72 flex-col flex-shrink-0 border-r border-slate-700/60 bg-slate-900/80 backdrop-blur-lg">
      <div className="px-6 py-6 border-b border-slate-700/50">
        <p className="text-lg xl:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Odatlar Klub
        </p>
        {userData && (
          <p className="text-sm text-slate-400 mt-1 truncate">
            {userData.name} · {userData.level}-daraja
          </p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {mainNavTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isNavActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="desktopActiveTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/25 to-purple-600/25 rounded-xl border border-blue-500/30"
                  transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                />
              )}
              <Icon className={`w-5 h-5 relative z-10 flex-shrink-0 ${active ? 'text-blue-400' : ''}`} />
              <span className="relative z-10 font-semibold text-sm xl:text-base">{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {userData && (
        <div className="p-4 border-t border-slate-700/50">
          <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-4">
            <p className="text-xs text-slate-400 mb-1">XP progress</p>
            <p className="text-sm font-semibold text-blue-300 mb-2">
              {userData.xp} / {userData.nextLevelXp}
            </p>
            <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (userData.xp / userData.nextLevelXp) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
