import React from 'react';
import { useVisitor } from '../state/VisitorProvider';
import { CONTACT_EMAIL } from '../config/pilot';
import { LEGAL } from '../config/legal';

const TITLES = { imprint: 'Imprint' } as const;

/** Who runs AgoraX. A private person for now: no company, KvK or VAT number. */
export const LegalPlaceholderScreen = ({ doc }: { doc: keyof typeof TITLES }) => {
  const { actions } = useVisitor();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-20 pb-10 sm:px-6">
      <h1 className="font-display text-[clamp(32px,6vw,48px)] leading-tight font-extrabold text-white">{TITLES[doc]}</h1>
      <div className="sheet mt-6 space-y-3 rounded-sheet p-5 text-[16px] leading-relaxed text-slate-200">
        <p>
          AgoraX is a student pilot run by {LEGAL.legalName}, a private person.
          <br />
          {LEGAL.postalAddress}
        </p>
        <p>AgoraX is not a registered company yet, so there is no KvK or VAT number.</p>
        <p>
          Email:{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-white underline underline-offset-4">
            {CONTACT_EMAIL}
          </a>
        </p>
        <button onClick={() => actions.setTab('notice')} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Read the privacy notice
        </button>
      </div>
    </div>
  );
};
