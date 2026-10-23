import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';
import { ProfileAvatar, displayNameOf } from '../components/Avatar';
import { maskPhone } from '../data/contact';
import { CONSENT_TEXTS } from '../data/consent';
import { timestampMillis } from '../services/firebaseService';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const ScreenTitle = ({ children }: { children: React.ReactNode }) => (
  <h1 className="mb-6 font-display leading-[0.95] font-extrabold tracking-[-0.025em] text-white" style={{ fontSize: 'clamp(36px, 8vw, 56px)' }}>
    {children}
  </h1>
);

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

export const ProfileScreen = () => {
  const { state, actions, meta } = useVisitor();
  const me = state.me;
  const since = timestampMillis(me?.createdAt);
  const sinceLabel = since ? (() => { const d = new Date(since); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; })() : '';

  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6 lg:pt-8">
      <div className="mb-8 flex items-center gap-5">
        <ProfileAvatar size={84} />
        <div className="min-w-0">
          <h1 className="truncate font-display text-[36px] leading-none font-extrabold tracking-[-0.02em] text-white">
            {displayNameOf(me?.displayName)}
          </h1>
          <button onClick={() => actions.openSheet('profile')} className="mt-2 min-h-11 text-[15px] font-semibold text-brand-secondary underline underline-offset-4">
            Edit profile
          </button>
        </div>
      </div>
      <div className="sheet overflow-hidden rounded-sheet">
        <Row label="My picks" value={meta.picks.length} onClick={() => actions.setTab('picks')} />
        <Row
          label="Updates on WhatsApp"
          value={me?.consents?.updates && me.phone ? maskPhone(me.phone) : 'Off'}
          onClick={() => actions.setTab('data')}
        />
        {sinceLabel && <Row label="On AgoraX since" value={sinceLabel} />}
        <Row label="City" value="Groningen" />
      </div>
      <p className="mt-4 text-[13px] text-slate-300">Only you can see this profile.</p>
    </div>
  );
};

const Switch = ({ label, hint, checked, disabled, onChange }: {
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (on: boolean) => void;
}) => (
  <div className="flex items-start justify-between gap-4 border-b border-sheet-line px-4 py-3.5 last:border-0">
    <div>
      <p className="text-[15px] text-white">{label}</p>
      {hint && <p className="mt-1 text-[13px] leading-snug text-slate-400">{hint}</p>}
    </div>
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="grid min-h-11 shrink-0 place-items-center disabled:opacity-40"
    >
      <span className={`flex h-7 w-12 items-center rounded-full p-0.5 transition-colors ${checked ? 'bg-brand-action' : 'bg-white/15'}`}>
        <span className={`size-6 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  </div>
);

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-8">
    <h2 className="mb-3 font-display text-[22px] font-bold text-white">{title}</h2>
    <div className="sheet overflow-hidden rounded-sheet">{children}</div>
  </section>
);

/** Privacy & my data: contact details, the privacy switches, and deletion, all in one place. */
export const MyDataScreen = () => {
  const { state, actions, meta } = useVisitor();
  const [confirming, setConfirming] = useState(false);
  const me = state.me;
  const hasContact = !!me?.hasContact;
  const shownInitials = [...meta.faces.values()].flat().filter((f) => f.uid === state.uid).length;

  return (
    <div className="mx-auto max-w-xl px-4 pt-16 sm:px-6 lg:pt-8">
      <ScreenTitle>Privacy & my data</ScreenTitle>

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
                  Delete my details
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <p className="text-[15px] text-slate-200">No contact details saved.</p>
            <button onClick={() => actions.openSheet('contact')} className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20">
              Add your WhatsApp
            </button>
          </div>
        )}
      </Block>

      <Block title="Privacy switches">
        <Switch
          label="Message me when an event I picked is happening"
          hint={CONSENT_TEXTS.updates}
          checked={!!me?.consents?.updates}
          onChange={(on) => (on && !hasContact ? actions.openSheet('contact') : void actions.setConsent('updates', on))}
        />
        <Switch
          label="Talk to me about events I offered to help run"
          hint={hasContact ? CONSENT_TEXTS.organising : 'Turns on when you offer to help run an event.'}
          checked={!!me?.consents?.organising}
          disabled={!hasContact}
          onChange={(on) => void actions.setConsent('organising', on)}
        />
        <Switch
          label="Count my visits in AgoraX statistics"
          hint="Which cards you saw and opened, without your name. Applies to this device. Your picks always count."
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
      </Block>

      <button onClick={() => actions.openSheet('privacy')} className="min-h-11 text-[15px] font-semibold text-slate-200 underline underline-offset-4">
        What we keep, why, and for how long
      </button>
    </div>
  );
};

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <li className="grid grid-cols-[3.5rem_1fr] gap-3">
    <span className="font-display text-[48px] leading-none font-extrabold text-brand-secondary tabular-nums">{n}</span>
    <div className="pt-1">
      <h2 className="font-display text-[22px] leading-tight font-bold text-white">{title}</h2>
      <p className="mt-1 max-w-[52ch] text-[15px] leading-relaxed text-slate-300">{children}</p>
    </div>
  </li>
);

export const HowItWorksScreen = () => {
  const { actions } = useVisitor();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6 lg:pt-8">
      <ScreenTitle>How AgoraX works</ScreenTitle>
      <ol className="space-y-7">
        <Step n={1} title="Pick what you'd go to">
          Tap "I'd join" on any event. It costs nothing, and you can leave any time.
        </Step>
        <Step n={2} title="Every event has a target">
          The bar shows how many people picked it and how many it needs to run.
        </Step>
        <Step n={3} title="Enough people? It happens">
          We set a date and a place and message everyone who left a WhatsApp number. You only pay then.
        </Step>
        <Step n={4} title="Not enough? Nothing happens">
          Nobody pays, and nobody loses anything.
        </Step>
      </ol>
      <p className="mt-10 text-[15px] text-slate-300">
        Want to run one?{' '}
        <button onClick={() => actions.setTab('events')} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Tap "Help run this" on an event
        </button>{' '}
        to see what a host keeps. Have an idea of your own?{' '}
        <button onClick={() => actions.setTab('propose')} className="min-h-11 font-semibold text-white underline underline-offset-4">
          Propose it
        </button>
        .
      </p>
    </div>
  );
};

const FAQ: [string, string][] = [
  ['Do I need an account?', 'No. Your picks are saved on this phone or laptop, under a random ID.'],
  ['Does picking an event cost money?', "No. You pay the listed price only if the event reaches its target and you still want to go."],
  ['What happens when an event reaches its target?', 'We pick a date and a place, and message everyone who left a WhatsApp number.'],
  ['Can I change my mind?', 'Yes. Tap Leave on the event or in My picks.'],
  ['Who can see that I picked an event?', 'Nobody, unless you tap "Show my initial" on it. Then only the first letter you choose is shown.'],
  ['Who runs the events?', 'Students. Anyone can offer to help run one and keep part of the money. "Help run this" shows how much.'],
  ['I use AgoraX on two devices.', "For now your picks stay on the device you made them on. Keeping them across devices is coming."],
  ['How do I get my details deleted?', 'Privacy & my data → Delete my details, or email sondarevn@gmail.com.'],
];

export const FaqScreen = () => (
  <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6 lg:pt-8">
    <ScreenTitle>FAQ</ScreenTitle>
    <div className="sheet divide-y divide-sheet-line overflow-hidden rounded-sheet">
      {FAQ.map(([q, a]) => (
        <details key={q} className="group px-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-[18px] font-bold text-white">
            {q}
            <ChevronRight size={18} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90" aria-hidden="true" />
          </summary>
          <p className="max-w-[60ch] pb-4 text-[15px] leading-relaxed text-slate-300">{a}</p>
        </details>
      ))}
    </div>
    <p className="mt-6 text-[15px] text-slate-300">
      Something else?{' '}
      <a href="mailto:sondarevn@gmail.com" className="font-semibold text-white underline underline-offset-4">
        sondarevn@gmail.com
      </a>
    </p>
  </div>
);
