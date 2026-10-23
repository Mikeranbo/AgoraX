import React, { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';
import { LIST_ID } from './ui';

export function scrollToList() {
  document.getElementById(LIST_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const Wordmark = () => (
  <p className="pt-2.5 pl-14 font-display text-[17px] font-extrabold tracking-tight text-white">
    Agora<span className="text-brand-secondary">X</span>
    <span className="ml-2 rounded-full border border-white/30 px-2 py-0.5 align-middle font-sans text-[12px] font-semibold tracking-normal text-slate-200">
      Pilot
    </span>
  </p>
);

const DownButton = ({ label }: { label: string }) => (
  <button
    onClick={scrollToList}
    className="inline-flex min-h-12 items-center gap-3 rounded-full border border-white/40 py-2 pr-5 pl-2 text-[15px] font-semibold text-white hover:border-white"
  >
    <span className="grid size-9 place-items-center rounded-full bg-white text-brand-dark">
      <ArrowDown size={18} strokeWidth={2.5} aria-hidden="true" />
    </span>
    {label}
  </button>
);

/**
 * What the pilot is and isn't, in full, where everyone sees it before the list. The three
 * distinctions that must survive any edit: these are estimates, not offers; interest is not a
 * booking or a payment; and only 1–3 well-supported, feasible events are aimed for.
 */
export const PilotExplainer = () => (
  <div className="sheet max-w-[62ch] space-y-3 rounded-sheet p-4 text-[16px] leading-relaxed text-pretty text-slate-200 sm:p-5">
    <p>
      <strong className="font-semibold text-white">AgoraX is a pilot, not a booking service.</strong> The event ideas, prices and
      organiser earnings here are estimates, not confirmed offers or guaranteed income.
    </p>
    <p>
      If enough people are interested and we can find suitable hosts and venues, we aim to run one to three of the most-supported
      events.
    </p>
    <p>
      Pick the activities you'd really go to at the price shown. Saying you're interested isn't a booking: you don't pay anything,
      and it doesn't guarantee the event will happen.
    </p>
  </div>
);

/**
 * The first view on "/": the invitation, the pilot explainer, one way down. Visitors who have
 * already said they're interested in something get a shorter version with their count.
 */
export const OpeningHero = () => {
  const { state, meta, actions } = useVisitor();
  const picks = meta.picks.length;
  // Decide once, when the list first loads: an interest further down must not resize the view
  // above and make the page jump.
  const returning = useRef<boolean | null>(null);
  if (returning.current === null && state.eventsLoaded) returning.current = picks > 0;

  if (returning.current) {
    return (
      <section className="flex min-h-[64dvh] snap-start flex-col justify-between gap-8 px-4 pt-5 pb-10 sm:px-8 lg:px-12">
        <Wordmark />
        <div>
          <h1
            className="max-w-[16ch] font-display leading-[0.92] font-extrabold tracking-[-0.035em] text-balance text-white"
            style={{ fontSize: 'clamp(40px, 9vw, 96px)' }}
          >
            Help choose which events happen next.
          </h1>
          <p className="mt-6 flex flex-wrap items-baseline gap-x-3 text-[15px] text-slate-300">
            <span className="font-display text-[40px] leading-none font-extrabold text-brand-secondary tabular-nums">{picks}</span>
            <span>
              {picks === 1 ? 'event' : 'events'} you're interested in.{' '}
              <button onClick={() => actions.setTab('picks')} className="min-h-11 font-semibold text-white underline underline-offset-4">
                See my interests
              </button>
            </span>
          </p>
          <p className="mt-3 max-w-[52ch] text-[14px] text-slate-300">
            Still a pilot: interest isn't a booking, and only the best-supported, workable events go ahead.{' '}
            <button onClick={() => actions.setTab('how')} className="font-semibold text-white underline underline-offset-4">
              How the pilot works
            </button>
          </p>
        </div>
        <div>
          <DownButton label="More events" />
        </div>
      </section>
    );
  }

  return (
    <section className="flex min-h-[100dvh] snap-start flex-col justify-between gap-8 px-4 pt-5 pb-28 sm:px-8 lg:px-12">
      <Wordmark />
      <div>
        <h1
          className="max-w-[14ch] font-display leading-[0.9] font-extrabold tracking-[-0.04em] text-balance text-white"
          style={{ fontSize: 'clamp(48px, 11vw, 120px)' }}
        >
          Help choose which events happen next.
        </h1>
        <div className="mt-6">
          <PilotExplainer />
        </div>
      </div>
      <div>
        <DownButton label="See the proposals" />
      </div>
    </section>
  );
};
