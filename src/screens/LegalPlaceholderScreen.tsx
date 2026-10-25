import React from 'react';
import { useVisitor } from '../state/VisitorProvider';
import { CONTACT_EMAIL } from '../config/pilot';

const TITLES = { terms: 'Terms of Use', cookies: 'Cookie Policy', imprint: 'Imprint' } as const;

/** A legal page that isn't written yet. It says so plainly instead of making anything up. */
export const LegalPlaceholderScreen = ({ doc }: { doc: keyof typeof TITLES }) => {
  const { actions } = useVisitor();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6">
      <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-tight font-extrabold text-white">{TITLES[doc]}</h1>
      <div className="sheet mt-6 space-y-3 rounded-sheet p-5 text-[16px] leading-relaxed text-slate-200">
        <p>This page isn't written yet. AgoraX is a pilot, and these documents are being prepared.</p>
        {doc === 'cookies' && (
          <p>
            Until it is, the privacy notice explains what the site keeps on your device (a random ID, your choices like the menu
            position, and whether you've seen the pilot note).
          </p>
        )}
        <p>
          Questions in the meantime:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-white underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <button onClick={() => actions.setTab('notice')} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Read the privacy notice
        </button>
      </div>
    </div>
  );
};
