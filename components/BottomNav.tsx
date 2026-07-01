'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { mainNavTabs, isNavActive } from '@/lib/navigation';

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden px-3 sm:px-4 pb-[calc(0.25rem+env(safe-area-inset-bottom,0px))]">
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        aria-label="Asosiy navigatsiya"
        className="max-w-6xl mx-auto border border-slate-700/60 bg-slate-900/95 backdrop-blur-lg rounded-2xl shadow-lg shadow-black/25 px-1.5 sm:px-2 py-2 sm:py-2.5"
      >
        <div className="grid grid-cols-4 gap-1">
          {mainNavTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isNavActive(pathname, tab.href);

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center min-w-0 py-1.5 sm:py-2 px-0.5 sm:px-1 transition-all"
              >
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                    className="absolute inset-0 bg-gradient-to-br from-blue-600/25 to-purple-600/25 rounded-xl border border-blue-500/35"
                  />
                )}

                <motion.div
                  animate={{ color: active ? '#60a5fa' : '#94a3b8' }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 mb-1"
                >
                  <Icon
                    className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${
                      active ? 'scale-110' : 'scale-100'
                    }`}
                  />
                </motion.div>

                <motion.span
                  animate={{
                    opacity: active ? 1 : 0.8,
                    color: active ? '#bfdbfe' : '#cbd5e1',
                  }}
                  transition={{ duration: 0.2 }}
                  className={`relative z-10 w-full text-center leading-tight px-0.5 min-h-[2rem] sm:min-h-[2.25rem] flex items-center justify-center text-[11px] sm:text-sm ${
                    active ? 'font-bold' : 'font-semibold'
                  }`}
                >
                  {active ? (
                    tab.label
                  ) : (
                    <>
                      <span className="min-[400px]:hidden">{tab.shortLabel}</span>
                      <span className="hidden min-[400px]:inline">{tab.label}</span>
                    </>
                  )}
                </motion.span>

                {active && (
                  <motion.div
                    layoutId="activeUnderline"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                    className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-8 sm:w-10 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </div>
  );
}
