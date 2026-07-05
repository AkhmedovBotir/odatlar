'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { mobileNavTabs, guideNavTab, isNavActive } from '@/lib/navigation';

const GUIDE_HREF = guideNavTab.href;

export default function BottomNav() {
  const pathname = usePathname();
  const guideActive = isNavActive(pathname, GUIDE_HREF);
  const GuideIcon = guideNavTab.icon;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 lg:hidden">
      <div className="pointer-events-auto mx-auto max-w-lg px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
        <motion.nav
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          aria-label="Asosiy navigatsiya"
          className="relative rounded-[1.35rem] border border-slate-700/40 bg-slate-950/90 px-1 pb-1 pt-2 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
        >
          <div className="grid grid-cols-5 items-end">
            {mobileNavTabs.map((tab) => {
              if (tab.href === GUIDE_HREF) {
                return (
                  <div key={tab.href} className="relative flex flex-col items-center">
                    <Link
                      href={tab.href}
                      aria-label={tab.label}
                      aria-current={guideActive ? 'page' : undefined}
                      className="group relative -mt-7 mb-0.5 flex flex-col items-center"
                    >
                      <motion.div
                        whileTap={{ scale: 0.92 }}
                        className={`relative flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full border-[3px] transition-all duration-300 ${
                          guideActive
                            ? 'border-slate-950 bg-gradient-to-b from-slate-700 to-slate-800 shadow-[0_0_24px_rgba(59,130,246,0.55),0_8px_20px_rgba(0,0,0,0.5)]'
                            : 'border-slate-950 bg-gradient-to-b from-slate-800 to-slate-900 shadow-[0_6px_18px_rgba(0,0,0,0.45)] group-hover:from-slate-700 group-hover:to-slate-800'
                        }`}
                      >
                        {guideActive && (
                          <motion.div
                            layoutId="guideNavGlow"
                            className="absolute inset-0 rounded-full ring-2 ring-blue-400/70 ring-offset-2 ring-offset-slate-950"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <GuideIcon
                          className={`relative z-10 h-6 w-6 transition-colors ${
                            guideActive
                              ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                              : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                          strokeWidth={guideActive ? 2.25 : 1.75}
                        />
                      </motion.div>

                      <span
                        className={`mt-1 max-w-full truncate text-center text-[9px] leading-tight min-[390px]:text-[10px] ${
                          guideActive
                            ? 'font-bold text-blue-400 drop-shadow-[0_0_6px_rgba(96,165,250,0.5)]'
                            : 'font-medium text-slate-500 group-hover:text-slate-300'
                        }`}
                      >
                        <span className="min-[390px]:hidden">{tab.shortLabel}</span>
                        <span className="hidden min-[390px]:inline">{tab.label}</span>
                      </span>
                    </Link>
                  </div>
                );
              }

              const Icon = tab.icon;
              const active = isNavActive(pathname, tab.href);

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-label={tab.label}
                  aria-current={active ? 'page' : undefined}
                  className="group relative flex min-h-[3.25rem] min-w-0 flex-col items-center justify-end gap-0.5 rounded-[1.1rem] px-0 pb-2 pt-1 transition-colors"
                >
                  {active && (
                    <motion.div
                      layoutId="bottomNavActive"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-x-0 bottom-1 top-1 rounded-[1.1rem] bg-slate-800/90"
                    />
                  )}

                  <div className="relative z-10 flex h-7 w-7 items-center justify-center">
                    <Icon
                      className={`transition-colors ${
                        active
                          ? 'h-[1.15rem] w-[1.15rem] text-blue-400'
                          : 'h-[1.1rem] w-[1.1rem] text-slate-500 group-hover:text-slate-300'
                      }`}
                      strokeWidth={active ? 2.25 : 1.75}
                    />
                  </div>

                  <span
                    className={`relative z-10 max-w-full truncate px-0 text-center text-[9px] leading-tight min-[390px]:text-[10px] ${
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
