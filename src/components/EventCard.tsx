import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Event } from '../types';
import { bumpEventCounter } from '../services/firebaseService';
import { track } from '../services/analytics';
import { once } from '../services/session';
import { canOfferHosting, keepPerHost, formatDuration } from '../data/earnings';
import { hasEnough } from '../data/progress';
import { closesLabel } from '../data/dates';
import { useVisitor } from '../state/VisitorProvider';
import { SignupList } from './SignupList';
import { primaryButtonClass, quietLinkClass } from './ui';

const DEFAULT_ACCENT = '#818cf8';

/**
 * One impression per card per session: an IntersectionObserver fires when the card is
 * actually on screen, and once() makes sure filtering and re-rendering never count it again.
 */
function useImpression(ref: React.RefObject<HTMLElement | null>, eventId: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        if (once(`impression:${eventId}`)) {
          void bumpEventCounter(eventId, 'impressions');
          track('card_impression', { eventId });
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, eventId]);
}

/** "€12 · 1.5 h · needs 12" */
export function metaLine(event: Event): string {
  return [event.price === 0 ? 'Free' : `€${event.price}`, formatDuration(event.durationHours), `needs ${event.minParticipants}`]
    .filter(Boolean)
    .join(' · ');
}

/** The coloured band at the top of a sign-up sheet: emoji, title, and what state it is in. */
export const EventBand = ({ event, children }: { event: Event; children: React.ReactNode }) => {
  const running = hasEnough(event);
  return (
    <div
      className="flex items-center gap-3 px-4 py-3"
      style={{ backgroundColor: `color-mix(in srgb, ${event.accent || DEFAULT_ACCENT} 50%, #0f172a)` }}
    >
      {event.emoji && (
        <span aria-hidden="true" className="text-[28px] leading-none">
          {event.emoji}
        </span>
      )}
      <div className="min-w-0 flex-1">{children}</div>
      {running ? (
        <span className="shrink-0 text-[13px] font-semibold text-happening-ink">This is happening</span>
      ) : (
        event.season === 'spring' && <span className="shrink-0 text-[13px] font-semibold text-white/90">Spring trip</span>
      )}
    </div>
  );
};

/** What the visitor can do on a list: join, or see they're in and leave. */
export const JoinActions = ({ event }: { event: Event }) => {
  const { state, actions, meta } = useVisitor();
  const busy = state.pending.has(event.id);

  if (event.status === 'Cancelled') return <p className="text-[15px] text-slate-400">This one is cancelled.</p>;

  if (meta.joined.has(event.id)) {
    return (
      <div className="flex items-center gap-2">
        <p className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-sheet border border-brand-primary/60 bg-brand-action/15 font-display text-[19px] font-bold text-white">
          <Check size={20} strokeWidth={3} /> You're in
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            void actions.leave(event);
          }}
          disabled={busy}
          className="min-h-11 px-3 text-[15px] font-semibold text-slate-300 underline underline-offset-4 hover:text-white disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Leave'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        void actions.join(event);
      }}
      disabled={busy}
      className={primaryButtonClass}
    >
      {busy ? 'Saving…' : "I'd join"}
    </button>
  );
};

/** "Help run this · keep ~€84", a quiet link under the main button. */
export const HelpRunLink = ({ event }: { event: Event }) => {
  const { actions } = useVisitor();
  if (!canOfferHosting(event) || event.status === 'Cancelled') return null;
  const keep = keepPerHost(event);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        actions.helpRun(event);
      }}
      className={quietLinkClass}
    >
      {keep >= 1 ? `Help run this · keep ~€${keep}` : 'Help run this'}
    </button>
  );
};

export const EventCard = ({ event }: { event: Event }) => {
  const { actions, meta } = useVisitor();
  const cardRef = useRef<HTMLElement>(null);
  useImpression(cardRef, event.id);
  const closes = closesLabel(event.deadline, new Date());

  return (
    <article
      ref={cardRef}
      id={`event-${event.id}`}
      onClick={() => actions.open(event)}
      className="sheet cursor-pointer overflow-hidden rounded-sheet transition-colors hover:border-slate-500 scroll-mt-24"
    >
      <EventBand event={event}>
        <h3 className="font-display text-[20px] font-bold leading-tight text-white">
          <button
            onClick={(e) => {
              e.stopPropagation();
              actions.open(event);
            }}
            className="text-left"
          >
            {event.title}
          </button>
        </h3>
      </EventBand>

      <div className="space-y-3 px-4 pt-3 pb-2">
        <p className="flex flex-wrap justify-between gap-x-3 text-[14px] text-slate-300">
          <span>{metaLine(event)}</span>
          {closes && <span className="text-slate-400">{closes}</span>}
        </p>
        <SignupList event={event} joined={meta.joined.has(event.id)} />
        <JoinActions event={event} />
        <HelpRunLink event={event} />
      </div>
    </article>
  );
};
