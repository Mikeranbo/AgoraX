import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/** A sheet that slides up from the bottom on phones and sits centred on wider screens. */
export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          className="fixed inset-0 bg-brand-dark/80 z-[60]"
        />
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="sheet fixed bottom-0 inset-x-0 mx-auto w-full max-w-lg rounded-t-sheet border-b-0 px-5 pt-5 pb-8 z-[70] max-h-[88dvh] overflow-y-auto"
        >
          <div className="flex justify-between items-start gap-4 mb-5">
            <h2 className="font-display text-[24px] font-bold leading-tight text-white">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center text-slate-300 hover:text-white"
            >
              <X size={22} />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
