import React from 'react';
import { Logo } from '../Logo';
import { useVisitor } from '../../state/VisitorProvider';
import { SIMPLE_EVENTS } from '../../data/simpleEvents';
import type { Event } from '../../types';

/**
 * concept-simple. The parts that replace the busy ones: a slim header, the three-step explainer
 * on top of the list, the four plain answers for each event, and a one-line footer.
 */

const navClass = (on: boolean) =>
  `inline-flex min-h-11 items-center rounded-sheet px-3 text-[15px] font-semibold ${on ? 'bg-white/10 text-white' : 'text-slate-300 hover:text-white'}`;

/** Logo and Pilot label; on wide screens the two places you can go, too. */
export const SimpleHeader = () => {
  const { state, actions, meta } = useVisitor();
  if (state.selected) return null;
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 pt-4 pb-2 sm:px-6">
      <button onClick={() => actions.setTab('events')} aria-label="AgoraX, all events" className="min-h-11">
        <Logo size={22} />
      </button>
      <nav aria-label="Main" className="hidden gap-1 lg:flex">
        <button onClick={() => actions.setTab('events')} aria-current={state.tab === 'events' ? 'page' : undefined} className={navClass(state.tab === 'events')}>
          Events
        </button>
        <button onClick={() => actions.setTab('picks')} aria-current={state.tab === 'picks' ? 'page' : undefined} className={navClass(state.tab === 'picks')}>
          {meta.picks.length ? `My picks (${meta.picks.length})` : 'My picks'}
        </button>
      </nav>
    </header>
  );
};

const STEPS: [string, string][] = [
  ['Pick', "Tap I'd go"],
  ['We count', 'Each event has a minimum'],
  ['It happens', 'or nobody pays'],
];

/** On top of the events page, always there: what this is, in one look. */
export const SimpleIntro = () => (
  <section aria-labelledby="simple-intro" className="mx-auto max-w-6xl px-4 pt-2 pb-4 sm:px-6">
    <h1 id="simple-intro" className="max-w-[22ch] font-display text-[clamp(28px,7vw,48px)] leading-[1.05] font-extrabold tracking-[-0.02em] text-white">
      Pick the events you'd actually go to.
    </h1>
    <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-slate-200 sm:text-[17px]">
      If enough people pick one, we organise it. Nothing is paid now. We'll message you if it happens.
    </p>
    <ol className="mt-4 grid max-w-2xl grid-cols-3 gap-2 sm:gap-3">
      {STEPS.map(([title, text], i) => (
        <li key={title} className="sheet rounded-sheet px-2.5 py-2 sm:flex sm:items-center sm:gap-3 sm:px-4 sm:py-3">
          <span aria-hidden="true" className="block font-display text-[20px] leading-none font-extrabold text-brand-secondary tabular-nums sm:text-[28px]">
            {i + 1}
          </span>
          <span className="mt-1 block sm:mt-0">
            <span className="block font-display text-[15px] leading-tight font-bold text-white sm:text-[17px]">{title}</span>
            <span className="block text-[12.5px] leading-snug text-slate-300 sm:text-[14px]">{text}</span>
          </span>
        </li>
      ))}
    </ol>
  </section>
);

/** The four plain answers. Events outside the shortlist fall back to what their data says. */
export function answersFor(event: Event) {
  const copy = SIMPLE_EVENTS[event.id];
  const hook = (event.description || '').split(/\n\s*\n/)[0];
  return {
    does: copy?.does ?? hook,
    included: copy?.included ?? event.venueNote ?? '',
    bring: copy ? copy.bring || 'Nothing' : event.bringYourOwn || 'Nothing',
    pays: copy?.pays ?? (event.price === 0 ? 'Free.' : `€${event.price} per person, an estimate. Nothing is paid now.`),
  };
}

/** On a card: short rows. On the event page: the same rows, larger. */
export const EventAnswers = ({ event, size = 'card' }: { event: Event; size?: 'card' | 'page' }) => {
  const a = answersFor(event);
  const rows: [string, string][] = [
    ['What you do', a.does],
    ["What's included", a.included],
    ['What you bring', a.bring],
    ['What the price pays for', a.pays],
  ];
  const page = size === 'page';
  return (
    <dl className={page ? 'grid gap-3 text-[15px] min-[760px]:grid-cols-[12rem_1fr] min-[760px]:gap-x-6' : 'space-y-1.5 text-[13.5px] leading-snug'}>
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) =>
          page ? (
            <React.Fragment key={k}>
              <dt className="font-semibold text-slate-400">{k}</dt>
              <dd className="-mt-2 text-white min-[760px]:mt-0">{v}</dd>
            </React.Fragment>
          ) : (
            <div key={k}>
              <dt className="inline font-semibold text-slate-400">{k}: </dt>
              <dd className="inline text-slate-200">{v}</dd>
            </div>
          ),
        )}
    </dl>
  );
};

const footLink = 'inline-flex min-h-11 items-center text-[14px] text-slate-300 underline-offset-4 hover:text-white hover:underline';

/** One line for anyone who wants to run or host something, then the legal links. */
export const SimpleFooter = () => {
  const { actions } = useVisitor();
  return (
    <footer className="w-full border-t border-white/10" style={{ background: 'rgba(14,17,38,.92)' }}>
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-8">
        <p className="text-[16px] text-white">
          Want to run or host something?{' '}
          <button onClick={() => actions.openSheet('tellus')} className="min-h-11 font-bold text-brand-secondary underline underline-offset-4 hover:text-white">
            Tell us
          </button>
        </p>
        <nav aria-label="Legal" className="mt-3 flex flex-wrap gap-x-5">
          <button onClick={() => actions.setTab('data')} className={footLink}>Privacy &amp; my data</button>
          <button onClick={() => actions.setTab('notice')} className={footLink}>Privacy notice</button>
          <button onClick={() => actions.setTab('terms')} className={footLink}>Terms</button>
          <button onClick={() => actions.setTab('cookies')} className={footLink}>Cookies</button>
          <button onClick={() => actions.setTab('imprint')} className={footLink}>Imprint</button>
          <button onClick={actions.openPilotNotice} className={footLink}>About the pilot</button>
        </nav>
        <p className="mt-2 text-[13px] text-slate-400">AgoraX is a pilot. Picking an event isn't a booking, and nothing is paid through AgoraX.</p>
      </div>
    </footer>
  );
};
