import React from 'react';
import { useVisitor } from '../state/VisitorProvider';
import { CONTACT_EMAIL } from '../config/pilot';
import { LEGAL, SOCIAL_LINKS, TO_BE_CONFIRMED } from '../config/legal';

const linkClass = 'inline-flex min-h-11 min-w-11 items-center text-left text-[15px] text-slate-200 underline-offset-4 hover:text-white hover:underline';

const Column = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="mb-2 font-display text-[15px] font-bold text-white">{title}</h2>
    <div className="flex flex-col items-start">{children}</div>
  </section>
);

/** On every screen: a rounded card at the bottom with company, legal, support and contact. */
export const SiteFooter = () => {
  const { actions } = useVisitor();
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-40 sm:px-6 lg:pb-12">
      <div className="rounded-[28px] border border-white/10 p-6 sm:p-10" style={{ background: 'rgba(14,17,38,.92)' }}>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Column title="Company">
            <button onClick={actions.openPilotNotice} className={linkClass}>About the pilot</button>
            <button onClick={() => actions.setTab('how')} className={linkClass}>How the pilot works</button>
            <button onClick={() => actions.editProposal(null)} className={linkClass}>Propose an event</button>
            <button onClick={() => actions.openSheet('space')} className={linkClass}>I have a space</button>
          </Column>
          <Column title="Legal">
            <button onClick={() => actions.setTab('notice')} className={linkClass}>Privacy Policy</button>
            <button onClick={() => actions.setTab('terms')} className={linkClass}>Terms of Use</button>
            <button onClick={() => actions.setTab('cookies')} className={linkClass}>Cookie Policy</button>
            <button onClick={() => actions.setTab('imprint')} className={linkClass}>Imprint</button>
          </Column>
          <Column title="Support">
            <button onClick={() => actions.setTab('faq')} className={linkClass}>FAQ</button>
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('AgoraX bug report')}`} className={linkClass}>Report a bug</a>
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>Contact us</a>
          </Column>
          <Column title="Contact">
            <p className="text-[15px] leading-relaxed text-slate-300">
              {LEGAL.legalName ?? `Legal name: ${TO_BE_CONFIRMED}`}
              <br />
              {LEGAL.postalAddress ?? `Postal address: ${TO_BE_CONFIRMED}`}
            </p>
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>{CONTACT_EMAIL}</a>
          </Column>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[13px] text-slate-300">
          <p>
            © 2026 AgoraX · Registration no. {LEGAL.registrationNumber ?? TO_BE_CONFIRMED} · VAT ID {LEGAL.vatId ?? TO_BE_CONFIRMED}
          </p>
          {SOCIAL_LINKS.length > 0 && (
            <nav aria-label="Social" className="flex gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a key={s.href} href={s.href} target="_blank" rel="noreferrer" className={linkClass}>{s.label}</a>
              ))}
            </nav>
          )}
        </div>
        <p className="mt-3 max-w-[70ch] text-[13px] text-slate-400">
          AgoraX is a pilot. Showing interest isn't a booking, and nothing is paid through AgoraX.
        </p>
      </div>
    </footer>
  );
};
