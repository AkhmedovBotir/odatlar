'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { sidebarNavTabs, isNavActive } from '@/lib/navigation';
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
        {sidebarNavTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isNavActive(pathname, tab.href);

          if (tab.variant === 'guide') {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`group relative mx-0.5 my-2 flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 transition-all ${
                  active
                    ? 'border-blue-500/45 bg-slate-800/90 text-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.12)]'
                    : 'border-slate-700/70 bg-slate-800/25 text-slate-400 hover:border-slate-600 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                    active
                      ? 'border-blue-500/50 bg-slate-950 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                      : 'border-slate-600/80 bg-slate-900/80 group-hover:border-slate-500'
                  }`}
                >
                  <Icon
                    className={`h-[1.15rem] w-[1.15rem] ${active ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-300'}`}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                </div>
                <span className={`text-sm xl:text-base ${active ? 'font-bold' : 'font-semibold'}`}>
                  {tab.label}
                </span>
              </Link>
            );
          }

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
