'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle } from 'lucide-react';

interface ConfirmSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  amountRupees?: number;
  savingRupees?: number;
  confirmLabel?: string;
  isSubmitting?: boolean;
}

export const ConfirmSheet: React.FC<ConfirmSheetProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  amountRupees,
  savingRupees,
  confirmLabel = 'Confirm & Pay',
  isSubmitting = false,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">{description}</p>

            {amountRupees !== undefined && (
              <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-50 mb-2">
                <span className="text-sm text-slate-500">You pay</span>
                <span className="text-xl font-black text-slate-900 num-tabular">
                  ₹{amountRupees.toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {savingRupees !== undefined && savingRupees > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl mb-4">
                <CheckCircle size={14} />
                Save about ₹{savingRupees.toLocaleString('en-IN')}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-[var(--paytm-navy)] text-white text-sm font-bold disabled:opacity-50"
              >
                {isSubmitting ? 'Processing…' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
