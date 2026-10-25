import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CircleAlert } from 'lucide-react';

const SLIDE = { duration: 1.05, ease: [0.7, 0, 0.2, 1] as const };

/** A highlighted line: welcoming, not alarming. */
const Highlight = ({ children }: { children: React.ReactNode }) => (
  <p
    className="flex items-start gap-3 rounded-2xl border px-4 py-3 font-bold text-white"
    style={{ background: 'rgba(255,107,129,.07)', borderColor: 'rgba(255,138,152,.28)' }}
  >
    <CircleAlert size={22} aria-hidden="true" className="mt-px shrink-0 text-x-warn" />
    <span>{children}</span>
  </p>
);

/**
 * Stage 2, and "About the pilot" later: what the pilot is. Only the two buttons close it (no
 * Escape, no outside tap, no scrolling past it). Neither button is consent to anything else.
 */
export const PilotNotice = ({ open, onClose, reduced }: { open: boolean; onClose: (forGood: boolean) => void; reduced: boolean }) => {
  const panel = useRef<HTMLDivElement>(null);

  // Focus moves into the dialog and Tab stays inside it.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => panel.current?.focus(), 50);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>('button, a[href]')];
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    // Wheel and touch scrolling go nowhere while the notice is up.
    const block = (e: Event) => {
      if (!panel.current?.contains(e.target as Node)) e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', block, { passive: false });
    window.addEventListener('touchmove', block, { passive: false });
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', block);
      window.removeEventListener('touchmove', block);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="notice"
          className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="absolute inset-0 backdrop-blur-[14px]" style={{ background: 'rgba(10,12,34,.35)' }} aria-hidden="true" />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pilot-notice-title"
            tabIndex={-1}
            initial={reduced ? { opacity: 0 } : { y: '100vh' }}
            animate={reduced ? { opacity: 1 } : { y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={reduced ? { duration: 0.3 } : SLIDE}
            className="relative max-h-[calc(100dvh-24px)] w-full max-w-[620px] overflow-y-auto rounded-[28px] border px-5 py-6 outline-none sm:px-10 sm:py-9"
            style={{
              background: 'rgba(20,24,58,.66)',
              borderColor: 'rgba(255,255,255,.14)',
              backdropFilter: 'blur(18px) saturate(150%)',
              WebkitBackdropFilter: 'blur(18px) saturate(150%)',
              boxShadow: '0 30px 80px rgba(4,6,24,.45)',
              fontFamily: 'var(--font-entry)',
            }}
          >
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[12px] font-bold tracking-[0.14em] text-white">
              <span className="size-2 rounded-full bg-x-cyan" aria-hidden="true" />
              PILOT
            </p>
            <h2 id="pilot-notice-title" className="entry-headline mt-4 text-[30px] text-white sm:text-[36px]">
              A quick note: this is a pilot
            </h2>
            <div className="mt-5 space-y-3 text-[16px] leading-relaxed font-medium text-x-text">
              <p>AgoraX is an experiment.</p>
              <Highlight>Events are not confirmed. Prices and potential earnings are hypothetical—not promises.</Highlight>
              <Highlight>Showing interest is not a booking, and you won’t be charged.</Highlight>
              <p>
                Want to organise an event? Press “Organize” and we’ll contact you about a possible collaboration.{' '}
                <strong className="rounded px-1 font-bold text-white" style={{ background: 'rgba(255,107,129,.16)' }}>
                  Clicking the button alone does not make you the organiser or commit you to running that event.
                </strong>
              </p>
              <p>We’d love your feedback! Explore the website, try to break things, and tell us what went wrong and where you found the problem.</p>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2" style={{ fontFamily: 'var(--font-brand)' }}>
              <button onClick={() => onClose(false)} className="min-h-[52px] rounded-2xl bg-white px-4 text-[16px] font-extrabold text-[#161B3E] hover:bg-x-text">
                Got it — explore
              </button>
              <button
                onClick={() => onClose(true)}
                className="min-h-[52px] rounded-2xl border border-white/40 px-4 text-[16px] font-extrabold text-white hover:border-white hover:bg-white/5"
              >
                Got it — don’t show again
              </button>
            </div>
            <p className="mt-4 text-center text-[14px]">
              <a href="/privacy" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center font-semibold text-x-muted underline underline-offset-4 hover:text-white">
                Privacy Notice
              </a>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
