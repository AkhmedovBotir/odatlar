'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { SlidersHorizontal, X } from 'lucide-react';
import { OverlayPortal } from '@/components/OverlayPortal';
import PeriodFilter from '@/components/habits/PeriodFilter';
import type { ArchiveDateFilter } from '@/lib/habits';
import { getArchiveFilterLabel } from '@/lib/habits';

interface ArchiveFilterButtonProps {
  onClick: () => void;
  isActive?: boolean;
}

export function ArchiveFilterButton({ onClick, isActive }: ArchiveFilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Filtrlash"
      className={`flex aspect-square h-full min-h-[2.5rem] w-10 flex-shrink-0 items-center justify-center rounded-xl transition-all sm:w-11 ${
        isActive
          ? 'bg-blue-600/25 text-blue-300'
          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
      }`}
    >
      <SlidersHorizontal className="h-4 w-4" />
    </button>
  );
}

interface ArchiveFilterModalProps {
  open: boolean;
  value: ArchiveDateFilter;
  onChange: (filter: ArchiveDateFilter) => void;
  onClose: () => void;
}

export default function ArchiveFilterModal({
  open,
  value,
  onChange,
  onClose,
}: ArchiveFilterModalProps) {
  const filterLabel = getArchiveFilterLabel(value);

  return (
    <AnimatePresence>
      {open && (
        <OverlayPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] overflow-y-auto bg-black/60 backdrop-blur-[2px]"
            onClick={onClose}
          >
            <div className="flex min-h-full justify-center px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-14 sm:items-center sm:px-6 sm:pb-10 sm:pt-10">
            <motion.div
              initial={{ y: -16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -12, opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md shrink-0 rounded-2xl border border-slate-600 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-2xl shadow-black/40"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white">Filtrlash</h2>
                  <p className="mt-1 truncate text-xs text-slate-400">{filterLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-white"
                  aria-label="Yopish"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <PeriodFilter value={value} onChange={onChange} embedded />
            </motion.div>
          </div>
        </motion.div>
        </OverlayPortal>
      )}
    </AnimatePresence>
  );
}
