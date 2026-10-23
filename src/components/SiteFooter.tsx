import React from 'react';
import { useVisitor } from '../state/VisitorProvider';
import { CONTACT_EMAIL } from '../config/pilot';

const linkClass = 'inline-flex min-h-11 items-center font-semibold text-slate-200 underline underline-offset-4 hover:text-white';

/** On every screen, for everyone: what AgoraX is, and where privacy and help are. */
export const SiteFooter = () => {
  const { actions } = useVisitor();
  return (
    // snap-end: the page snaps to the list (index.css); without its own snap position the footer
    // below the list could not be scrolled to.
    <footer className="mx-auto max-w-6xl snap-end px-4 pb-40 text-[14px] text-slate-300 sm:px-6 lg:pb-12">
      <div className="border-t border-white/10 pt-5">
        <p className="max-w-[60ch]">AgoraX is a pilot. Saying you're interested isn't a booking, and nothing is paid through AgoraX.</p>
        <nav aria-label="Footer" className="mt-2 flex flex-wrap gap-x-5">
          <button onClick={() => actions.setTab('notice')} className={linkClass}>Privacy notice</button>
          <button onClick={() => actions.setTab('how')} className={linkClass}>How the pilot works</button>
          <button onClick={() => actions.setTab('faq')} className={linkClass}>FAQ</button>
          <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>Contact</a>
        </nav>
      </div>
    </footer>
  );
};
