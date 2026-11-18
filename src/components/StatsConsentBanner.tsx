import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';

const choiceClass =
  'min-h-11 flex-1 rounded-sheet border px-4 text-[15px] font-bold transition-colors sm:flex-none';

/**
 * Asks once whether we may count this visit. Nothing is tracked until "Allow"; "No thanks" is
 * just as easy, and the answer can be changed later in Privacy & my data. What the site needs to
 * work (the anonymous sign-in, your interests) is not statistics and is never asked about here.
 */
export const StatsConsentBanner = () => {
  const { state, actions } = useVisitor();
  if (state.entry !== 'done' || state.statsAsked) return null;
  return (
    <section
      aria-label="Visit statistics"
      className="sheet fixed inset-x-3 bottom-[calc(4.25rem+env(safe-area-inset-bottom))] z-[45] rounded-sheet p-4 shadow-2xl lg:bottom-4 lg:left-[calc(var(--nav-w)+0.75rem)] lg:max-w-xl"
    >
      <div className="flex items-start gap-3">
        <BarChart3 size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-brand-secondary" />
        <div className="min-w-0">
          <h2 className="font-display text-[17px] font-bold text-white">Can we count your visit?</h2>
          <p className="mt-1 text-[14px] leading-relaxed text-slate-300">
            Only if you say yes: which events you look at and how far you scroll, so we learn what students want. No name, no
            contact details. Everything works the same either way.{' '}
            <button onClick={() => actions.setTab('cookies')} className="font-semibold text-white underline underline-offset-4">
              Cookie Policy
            </button>
          </p>
        </div>
      </div>
      <div className="mt-3 flex gap-2 sm:justify-end">
        <button onClick={() => actions.setStatsOff(true)} className={`${choiceClass} border-sheet-line text-white hover:border-slate-400`}>
          No thanks
        </button>
        <button onClick={() => actions.setStatsOff(false)} className={`${choiceClass} border-white bg-white text-brand-dark hover:bg-slate-200`}>
          Allow
        </button>
      </div>
    </section>
  );
};
