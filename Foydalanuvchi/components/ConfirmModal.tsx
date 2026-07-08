'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { OverlayPortal } from '@/components/OverlayPortal';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'O\'chirish',
  cancelLabel = 'Bekor',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <OverlayPortal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
            onClick={onCancel}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[min(90vh,calc(100dvh-env(safe-area-inset-top,0px)-1rem))] w-full max-w-sm overflow-y-auto rounded-t-2xl border border-slate-600 bg-gradient-to-br from-slate-800 to-slate-700 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:rounded-xl"
            >
            <h2 className="text-lg font-bold mb-2">{title}</h2>
            <p className="text-sm text-slate-300 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="flex-1 bg-slate-700 hover:bg-slate-600 rounded-lg py-2.5 text-sm font-semibold transition-all"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 bg-red-600 hover:bg-red-500 rounded-lg py-2.5 text-sm font-semibold transition-all"
              >
                {confirmLabel}
              </button>
            </div>
            </motion.div>
          </motion.div>
        </OverlayPortal>
      )}
    </AnimatePresence>
  );
}
