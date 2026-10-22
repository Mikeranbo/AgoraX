/** Shared class strings, so every form and button on the public site looks the same. */

export const fieldClass =
  'w-full min-h-11 rounded-sheet bg-brand-dark border border-sheet-line px-3 py-2.5 text-[16px] text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-secondary';

export const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5';

/** Primary action. 19px bold keeps white text readable on both ends of the gradient. */
export const primaryButtonClass =
  'gradient-brand w-full min-h-12 px-4 rounded-sheet font-display text-[19px] font-bold text-white transition-transform active:translate-y-px disabled:opacity-60';

/** Secondary action that should not compete with the primary one. */
export const quietLinkClass =
  'inline-flex min-h-11 items-center text-[15px] font-semibold text-brand-secondary underline decoration-brand-secondary/40 underline-offset-4 hover:decoration-brand-secondary';

export const errorClass = 'text-sm text-red-300';

/** Anchor of the event list, below the opening view. */
export const LIST_ID = 'events-list';
