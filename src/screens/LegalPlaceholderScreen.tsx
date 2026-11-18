import React from 'react';
import { useVisitor } from '../state/VisitorProvider';
import { CONTACT_EMAIL } from '../config/pilot';

const TITLES = { imprint: 'Imprint' } as const;

/** A legal page that isn't written yet. It says so plainly instead of making anything up. */
export const LegalPlaceholderScreen = ({ doc }: { doc: keyof typeof TITLES }) => {
  const { actions } = useVisitor();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6">
      <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-tight font-extrabold text-white">{TITLES[doc]}</h1>
      <div className="sheet mt-6 space-y-3 rounded-sheet p-5 text-[16px] leading-relaxed text-slate-200">
        <p>
          The company details that belong here (legal name, address, KvK number) are still to be confirmed. AgoraX is a pilot run
          by Nikita Sondarev.
        </p>
        <p>
          Questions in the meantime:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-white underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <button onClick={() => actions.setTab('notice')} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Read the Privacy Policy
        </button>
      </div>
    </div>
  );
};
