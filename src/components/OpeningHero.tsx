import React, { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { useVisitor } from '../state/VisitorProvider';
import { LIST_ID } from './ui';

export function scrollToList() {
  document.getElementById(LIST_ID)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const Wordmark = () => (
  <p className="font-display text-[17px] font-extrabold tracking-tight text-white">
    Agora<span className="text-brand-secondary">X</span>
  </p>
);

const DownButton = ({ label }: { label: string }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      scrollToList();
    }}
    className="inline-flex min-h-12 items-center gap-3 rounded-full border border-white/40 py-2 pr-5 pl-2 text-[15px] font-semibold text-white hover:border-white"
  >
    <span className="grid size-9 place-items-center rounded-full bg-white text-brand-dark">
      <ArrowDown size={18} strokeWidth={2.5} />
    </span>
    {label}
  </button>
);

/**
 * The first view on "/": one huge line, one small line, one way down. Visitors who have
 * already picked something get a shorter version with their count.
 */
export const OpeningHero = () => {
  const { state, meta, actions } = useVisitor();
  const picks = meta.picks.length;
  // Decide once, when the list first loads: a join further down must not resize the view
  // above and make the page jump.
  const returning = useRef<boolean | null>(null);
  if (returning.current === null && state.eventsLoaded) returning.current = picks > 0;

  if (returning.current) {
    return (
      <section className="flex min-h-[64dvh] snap-start flex-col justify-between gap-10 px-4 pt-5 pb-10 sm:px-8 lg:px-12">
        <Wordmark />
        <div>
          <h1
            className="max-w-[14ch] font-display leading-[0.9] font-extrabold tracking-[-0.035em] text-balance text-white"
            style={{ fontSize: 'clamp(44px, 10vw, 104px)' }}
          >
            Pick the events you'd actually go to.
          </h1>
          <p className="mt-6 flex flex-wrap items-baseline gap-x-3 text-[15px] text-slate-300">
            <span className="font-display text-[40px] leading-none font-extrabold text-brand-secondary tabular-nums">{picks}</span>
            <span>
              picked so far.{' '}
              <button onClick={() => actions.setTab('picks')} className="min-h-11 font-semibold text-white underline underline-offset-4">
                See my picks
              </button>
            </span>
          </p>
        </div>
        <div>
          <DownButton label="More events" />
        </div>
      </section>
    );
  }

  return (
    <section
      onClick={scrollToList}
      className="flex min-h-[100dvh] cursor-pointer snap-start flex-col justify-between gap-10 px-4 pt-5 pb-28 sm:px-8 lg:px-12"
    >
      <Wordmark />
      <div>
        <h1
          className="max-w-[12ch] font-display leading-[0.88] font-extrabold tracking-[-0.04em] text-balance text-white"
          style={{ fontSize: 'clamp(56px, 14vw, 140px)' }}
        >
          Pick the events you'd actually go to.
        </h1>
        <p className="mt-6 max-w-[34ch] text-[15px] leading-snug text-pretty text-slate-300">When enough people pick one, it happens.</p>
      </div>
      <div>
        <DownButton label="See the events" />
      </div>
    </section>
  );
};
