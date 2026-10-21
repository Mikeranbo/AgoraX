import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-brand-dark/80 backdrop-blur-sm z-[60]"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Dialog'}
          className="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-lg md:max-w-xl mx-auto glass rounded-t-[40px] p-8 z-[70] max-h-[85vh] overflow-y-auto no-scrollbar border-t border-white/20"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-black text-white">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="p-2 glass rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>
          {children}
        </motion.div>
      </>
    )}
  </AnimatePresence>
);
