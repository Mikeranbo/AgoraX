import React from 'react';
import { X } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';

/** Once, after the first interest: ask how to reach them. Dismissed means gone for good. */
export const ContactBanner = () => {
  const { state, actions, meta } = useVisitor();
  // My interests has its own "Add a way to reach you", so the banner stays off that tab.
  if (meta.picks.length === 0 || state.me?.hasContact || state.bannerDismissed || state.tab === 'picks') return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 lg:bottom-4 lg:left-[calc(var(--nav-w)+0.75rem)]">
      <div className="sheet mx-auto flex max-w-md items-center gap-3 rounded-sheet py-2 pl-4 pr-1">
        <p className="flex-1 text-[14px] leading-snug text-slate-200">
          Want to hear whether your events go ahead? Leave an email or WhatsApp.
        </p>
        <button
          onClick={() => actions.openSheet('contact')}
          className="gradient-brand min-h-11 shrink-0 rounded-sheet px-3 text-[15px] font-bold text-white"
        >
          Add it
        </button>
        <button onClick={actions.dismissBanner} aria-label="Not now" className="grid size-11 shrink-0 place-items-center text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
