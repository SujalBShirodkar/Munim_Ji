'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ShieldCheck } from 'lucide-react';

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
  isSubmitting = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="w-full max-w-md bg-white dark:bg-paper-darkCard rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-ink dark:text-white font-bold text-lg">
                <ShieldCheck className="text-paytm-cyan" size={24} />
                <span>{title}</span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {description}
              </p>

              {amountRupees !== undefined && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Total Payable:</span>
                  <span className="text-2xl font-black text-ink dark:text-white">
                    ₹{amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}

              {savingRupees !== undefined && savingRupees > 0 && (
                <div className="flex items-center gap-2 text-xs font-semibold text-mint-dark dark:text-mint bg-mint-light/60 px-3 py-2 rounded-xl">
                  <CheckCircle size={16} />
                  <span>Estimated Net Bachat: ₹{savingRupees.toLocaleString('en-IN')} (Illustrative)</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                By confirming, you agree to payment via Paytm Sandbox and our fair pooled terms. If group MOQ is not met by the deadline, payments are automatically refunded.
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onConfirm}
                className="flex-1 py-3 px-4 rounded-xl bg-paytm-cyan hover:bg-paytm-hover text-white font-bold text-sm shadow-md transition disabled:opacity-50"
              >
                {isSubmitting ? 'Processing...' : confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

