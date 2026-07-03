'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { mainNavTabs, isNavActive } from '@/lib/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="pointer-events-auto mx-auto max-w-lg px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <motion.nav
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          aria-label="Asosiy navigatsiya"
          className="rounded-[1.35rem] border border-slate-700/40 bg-slate-950/90 p-1 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <div className="grid grid-cols-4">
            {mainNavTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isNavActive(pathname, tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                  className="group relative flex min-h-[3.65rem] min-w-0 flex-col items-center justify-center gap-0.5 rounded-[1.1rem] px-0.5 py-2 transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="bottomNavActive"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-[1.1rem] bg-slate-800/90"
                    />
                  )}

                  <div className="relative z-10 flex h-8 w-8 items-center justify-center">
                    <Icon
                      className={`transition-colors ${
                        active
                          ? 'h-[1.3rem] w-[1.3rem] text-blue-400'
                          : 'h-5 w-5 text-slate-500 group-hover:text-slate-300'
                      }`}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                  </div>

                  <span
                    className={`relative z-10 max-w-full truncate px-0.5 text-center text-[10px] leading-tight ${
                      active ? 'font-semibold text-blue-300' : 'font-medium text-slate-500'
                    }`}
                  >
                    <span className="min-[390px]:hidden">{tab.shortLabel}</span>
                    <span className="hidden min-[390px]:inline">{tab.label}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </motion.nav>
      </div>
    </div>
  );
}
