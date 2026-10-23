import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';
import { maskPhone } from '../data/contact';
import { CONTACT_EMAIL } from '../config/pilot';
import { PilotExplainer } from '../components/OpeningHero';
import { Block, ScreenTitle, Switch } from './SettingsScreens';

const Row = ({ label, value, onClick }: { label: string; value: React.ReactNode; onClick?: () => void }) => {
  const body = (
    <>
      <span className="text-[14px] text-slate-400">{label}</span>
      <span className="flex items-center gap-1 text-right text-[15px] text-white">
        {value}
        {onClick && <ChevronRight size={16} className="text-slate-400" aria-hidden="true" />}
      </span>
    </>
  );
  const className = 'flex min-h-12 w-full items-center justify-between gap-4 border-b border-sheet-line px-4 last:border-0';
  return onClick ? (
    <button onClick={onClick} className={`${className} hover:bg-white/5`}>{body}</button>
  ) : (
    <div className={className}>{body}</div>
  );
};

/** Privacy & my data: what we hold about you, the privacy switches, and deletion. */
export const MyDataScreen = () => {
  const { state, actions, meta } = useVisitor();
  const [confirming, setConfirming] = useState(false);
  const me = state.me;
  const hasContact = !!me?.hasContact;
  const shownInitials = [...meta.faces.values()].flat().filter((f) => f.uid === state.uid).length;

  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6">
      <ScreenTitle>Privacy &amp; my data</ScreenTitle>

      <Block title="Contact details">
        {hasContact ? (
          <>
            {me?.phone && <Row label="WhatsApp" value={maskPhone(me.phone)} />}
            {me?.email && <Row label="Email" value={`${me.email.charAt(0)}…@${me.email.split('@')[1] ?? ''}`} />}
            {me?.name && <Row label="First name" value={me.name} />}
            <Row label="Change" value="" onClick={() => actions.openSheet('contact')} />
            <div className="px-4 py-3">
              {confirming ? (
                <p className="flex flex-wrap items-center gap-x-4 text-[15px] text-slate-200">
                  Delete your number, email, name and initials?
                  <button
                    onClick={async () => {
                      await actions.deleteContact();
                      setConfirming(false);
                    }}
                    className="min-h-11 font-bold text-red-300 underline underline-offset-4"
                  >
                    Delete
                  </button>
                  <button onClick={() => setConfirming(false)} className="min-h-11 font-semibold text-slate-300 underline underline-offset-4">
                    Keep them
                  </button>
                </p>
              ) : (
                <button onClick={() => setConfirming(true)} className="min-h-11 text-[15px] font-semibold text-red-300 underline underline-offset-4">
                  Delete my contact details
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-[15px] text-slate-200">No contact details saved.</p>
            <button onClick={() => actions.openSheet('contact')} className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20">
              Add an email or WhatsApp
            </button>
          </div>
        )}
      </Block>

      <Block title="Privacy switches">
        <Switch
          label="Count my visits in AgoraX statistics"
          hint="Which cards you saw and opened, without your name. Applies to this device. Your interests always count."
          checked={!state.statsOff}
          onChange={(on) => actions.setStatsOff(!on)}
        />
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <p className="text-[15px] text-white">
            Initial shown on {shownInitials} {shownInitials === 1 ? 'event' : 'events'}
          </p>
          {shownInitials > 0 && (
            <button onClick={() => void actions.hideAllInitials()} className="min-h-11 text-[15px] font-semibold text-brand-secondary underline underline-offset-4">
              Hide all
            </button>
          )}
        </div>
        {me?.publicId && (
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <p className="text-[15px] text-white">Public profile</p>
            <button onClick={() => void actions.deletePublicProfile()} className="min-h-11 text-[15px] font-semibold text-red-300 underline underline-offset-4">
              Delete it
            </button>
          </div>
        )}
      </Block>

      <div className="sheet mb-8 overflow-hidden rounded-sheet">
        <Row label="Messages we may send you" value="Notification preferences" onClick={() => actions.setTab('notifications')} />
        <Row label="Everything, including this account" value="Delete my data" onClick={() => actions.setTab('account')} />
      </div>

      <button onClick={() => actions.setTab('notice')} className="min-h-11 text-[15px] font-semibold text-slate-200 underline underline-offset-4">
        Privacy notice: what we keep, why, and for how long
      </button>
    </div>
  );
};

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="grid grid-cols-[3.5rem_1fr] gap-3">
    <span aria-hidden="true" className="font-display text-[48px] leading-none font-extrabold text-brand-secondary tabular-nums">{n}</span>
    <div className="pt-1">
      <h2 className="font-display text-[22px] leading-tight font-bold text-white">{title}</h2>
      <p className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-slate-300">{children}</p>
    </div>
  </li>
);

export const HowItWorksScreen = () => {
  const { actions } = useVisitor();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
      <ScreenTitle>How the pilot works</ScreenTitle>
      <PilotExplainer />
      <ol className="sheet mt-6 space-y-7 rounded-sheet p-4 sm:p-6">
        <Step n={1} title="Say what you'd go to">
          Tap "I'm interested" on any proposal you'd really attend at the indicative price. It costs nothing and you can withdraw any time.
        </Step>
        <Step n={2} title="Every proposal has a target">
          The bar shows how many people are interested and how many we'd want before looking at running it. The numbers are real sign-ups.
        </Step>
        <Step n={3} title="We look at the best-supported ones">
          Reaching the target doesn't make an event happen. We still need hosts, a venue and a date. We aim to run one to three events in
          this pilot.
        </Step>
        <Step n={4} title="We tell you either way">
          If you left an email or number, we'll tell you whether your events go ahead, are cancelled or won't happen. Nothing is paid through
          AgoraX.
        </Step>
      </ol>
      <p className="sheet mt-6 rounded-sheet p-4 text-[15px] text-slate-300 sm:p-6">
        Want to run one?{' '}
        <button onClick={() => actions.setTab('events')} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Tap "Help run this" on a proposal
        </button>{' '}
        to see an estimate of what a host might keep. Have an idea of your own?{' '}
        <button onClick={() => actions.editProposal(null)} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Propose it
        </button>
        .
      </p>
    </div>
  );
};

const FAQ: [string, string][] = [
  ['Is this a booking?', "No. AgoraX is a pilot. Saying you're interested isn't a booking or a ticket, and it doesn't guarantee the event will happen."],
  ['Do I pay anything?', 'No. Nothing is paid through AgoraX. Prices are estimates of what an event might cost if it ran.'],
  ['What happens when a proposal reaches its target?', "We look at whether we can find hosts, a venue and a date. Only the best-supported, workable ones go ahead; we aim for one to three in this pilot."],
  ['Do I need an account?', 'No login. Your interests are saved in this browser under a random ID.'],
  ['Can I change my mind?', 'Yes. Tap Withdraw on the proposal or in My interests.'],
  ['Who can see what I picked?', 'Nobody, unless you tap "Show my initial" on it. Then only the one letter you choose is shown.'],
  ['Are the organiser earnings real?', "They're illustrative estimates at the target number of people, not an offer or guaranteed income."],
  ['Who are the organisers?', "Students and student groups describe themselves. AgoraX doesn't check or verify them."],
  ['I use AgoraX on two devices.', 'For now your interests stay on the device you used. Keeping them across devices is on our list of ideas.'],
  ['How do I get my data deleted?', `Account & security → Delete my data, or email ${CONTACT_EMAIL}.`],
];

export const FaqScreen = () => (
  <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
    <ScreenTitle>FAQ</ScreenTitle>
    <div className="sheet divide-y divide-sheet-line overflow-hidden rounded-sheet">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-[18px] font-bold text-white">
            {q}
            <ChevronRight size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90 motion-reduce:transition-none" aria-hidden="true" />
          </summary>
          <p className="max-w-[60ch] pb-4 text-[15px] leading-relaxed text-slate-300">{a}</p>
        </details>
      ))}
    </div>
    <p className="mt-6 text-[15px] text-slate-300">
      Something else?{' '}
      <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-white underline underline-offset-4">
        {CONTACT_EMAIL}
      </a>
    </p>
  </div>
);
