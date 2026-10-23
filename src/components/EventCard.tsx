import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'motion/react';
import { Bookmark, BookmarkCheck, CalendarClock, Check, Users } from 'lucide-react';
import { Event } from '../types';
import { bumpEventCounter, Face } from '../services/firebaseService';
import { track } from '../services/analytics';
import { once } from '../services/session';
import { canOfferHosting, keepPerHost } from '../data/earnings';
import { isConfirmed, progressLabel, progressPercent, targetReached } from '../data/progress';
import { formatEventDate, isScheduled } from '../data/schedule';
import { photoFor } from '../data/photos';
import { useVisitor } from '../state/VisitorProvider';
import { quietLinkClass } from './ui';
import { colourFor } from './Avatar';

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

export const priceLabel = (event: Event) => (event.price === 0 ? 'Free' : `€${event.price}`);

/** "Sat 14 Nov, 19:30 CET" for a scheduled event; proposals have no date yet. */
export const dateLabel = (event: Event) => (isScheduled(event) ? formatEventDate(event.startTime) : 'Date to be confirmed');

/** The event's photo, or its emoji on its own colour when there is none or it fails to load. */
export const PhotoBackdrop = ({ event, className = '', children }: { event: Event; className?: string; children?: React.ReactNode }) => {
  const url = photoFor(event);
  const [failed, setFailed] = useState(false);
  const accent = event.accent || DEFAULT_ACCENT;

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ backgroundColor: `color-mix(in srgb, ${accent} 55%, #0f172a)` }}>
      {url && !failed ? (
        <img src={url} alt="" loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-6xl">{event.emoji}</span>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/85 via-transparent to-[#0f172a]/30" />
      {children}
    </div>
  );
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full bg-[#0f172a]/80 px-3 py-1 text-[13px] font-semibold text-white">{children}</span>
);

/** "Confirmed" only when an admin confirmed it; everything else is labelled a proposal. */
export const StatusChip = ({ event }: { event: Event }) =>
  isConfirmed(event) ? (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-happening px-3 py-1 text-[13px] font-bold text-brand-dark">
      <Check size={14} strokeWidth={3} aria-hidden="true" /> Confirmed
    </span>
  ) : (
    <span className="rounded-full border border-white/30 bg-[#0f172a]/80 px-3 py-1 text-[13px] font-semibold text-white">Proposal</span>
  );

/** Saved for later: private, and separate from saying you're interested. */
export const SaveButton = ({ event }: { event: Event }) => {
  const { actions, meta } = useVisitor();
  const saved = meta.saved.has(event.id);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        void actions.toggleSaved(event);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Saved: ${event.title}. Remove from saved` : `Save ${event.title} for later`}
      className="grid size-11 shrink-0 place-items-center rounded-full bg-[#0f172a]/80 text-white hover:bg-[#0f172a]"
    >
      {saved ? <BookmarkCheck size={20} className="text-brand-secondary" /> : <Bookmark size={20} />}
    </button>
  );
};

/** Category, "Proposal"/"Confirmed" and "Spring trip" top left, the save toggle top right. */
export const PhotoBadges = ({ event, save = true }: { event: Event; save?: boolean }) => (
  <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
    <span className="flex flex-wrap gap-1.5">
      <StatusChip event={event} />
      <Chip>{event.category}</Chip>
      {event.season === 'spring' && <Chip>Spring trip</Chip>}
    </span>
    {save && <SaveButton event={event} />}
  </div>
);

/** The card's header: photo, badges, and the date (or "Date to be confirmed") bottom right. */
export const EventPhoto = ({ event, className = '' }: { event: Event; className?: string }) => (
  <PhotoBackdrop event={event} className={className}>
    <PhotoBadges event={event} />
    <span className="absolute right-3 bottom-3">
      <Chip>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={14} aria-hidden="true" /> {dateLabel(event)}
        </span>
      </Chip>
    </span>
  </PhotoBackdrop>
);

/** Initials of joiners who chose to show them. Never more than five circles. */
const Avatars = ({ faces }: { faces: Face[] }) => {
  if (faces.length === 0) return null;
  return (
    <span className="flex -space-x-2" aria-label={`${faces.length} ${faces.length === 1 ? 'person shows' : 'people show'} their initial`}>
      {faces.slice(0, 5).map((f) => (
        <span
          key={f.uid}
          aria-hidden="true"
          className="grid size-7 place-items-center rounded-full font-display text-[13px] font-bold text-brand-dark ring-2 ring-sheet"
          style={{ backgroundColor: colourFor(f.uid) }}
        >
          {f.initial.toUpperCase()}
        </span>
      ))}
    </span>
  );
};

/** Bars fill once per visit: the first time each one is on screen. */
const filledThisVisit = new Set<string>();

/** "8 interested · target 12" from real sign-ups, the shown initials, and the bar toward the target. */
export const PeopleLine = ({ event }: { event: Event }) => {
  const { meta } = useVisitor();
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [armed] = useState(() => !reduced && !filledThisVisit.has(event.id));
  const inView = useInView(ref, { once: true, amount: 0.6 });
  useEffect(() => {
    if (inView) filledThisVisit.add(event.id);
  }, [inView, event.id]);

  const count = Math.max(0, event.participantsCount || 0);
  const confirmed = isConfirmed(event);
  const reached = targetReached(event);
  const width = confirmed || reached ? 100 : progressPercent(event);

  return (
    <div ref={ref}>
      <div className="mb-2 flex min-h-7 items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[15px] text-slate-200 tabular-nums">
          <Users size={16} className="text-brand-primary" aria-hidden="true" />
          <span>
            <span className="font-semibold text-white">{count} interested</span> · target {event.minParticipants}
            {reached && !confirmed && <span className="block text-[13px] text-slate-300">Target reached · not confirmed yet</span>}
          </span>
        </p>
        <Avatars faces={meta.faces.get(event.id) ?? []} />
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Interest toward the target"
        aria-valuetext={progressLabel(event)}
        aria-valuemin={0}
        aria-valuemax={event.minParticipants}
        aria-valuenow={count}
      >
        <motion.div
          className={`h-full origin-left rounded-full ${confirmed ? 'bg-happening' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`}
          initial={armed ? { scaleX: 0 } : false}
          animate={{ scaleX: armed && !inView ? 0 : width / 100 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

/** Indicative price on the left, always visible; "I'm interested" on the right. */
export const PriceAndAction = ({ event, size = 'card' }: { event: Event; size?: 'card' | 'large' }) => {
  const { state, actions, meta } = useVisitor();
  const busy = state.pending.has(event.id);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="flex flex-col">
        <span
          className={`font-display leading-none font-extrabold tracking-[-0.02em] text-white tabular-nums ${size === 'large' ? 'text-[40px]' : 'text-[30px]'}`}
        >
          {priceLabel(event)}
        </span>
        {event.price > 0 && <span className="mt-1 text-[12px] text-slate-400">indicative price</span>}
      </p>
      {event.status === 'Cancelled' ? (
        <p className="text-[15px] text-slate-300">Cancelled</p>
      ) : meta.joined.has(event.id) ? (
        <div className="flex items-center gap-1">
          <p className="flex min-h-12 items-center gap-1.5 rounded-sheet border border-brand-primary/60 bg-brand-action/20 px-4 font-display text-[17px] font-bold text-white">
            <Check size={18} strokeWidth={3} aria-hidden="true" /> Interested
          </p>
          <button
            onClick={(e) => {
              stop(e);
              void actions.leave(event);
            }}
            disabled={busy}
            aria-label={`Withdraw interest in ${event.title}`}
            className="min-h-11 px-2 text-[15px] font-semibold text-slate-300 underline underline-offset-4 hover:text-white disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Withdraw'}
          </button>
        </div>
      ) : (
        <button
          onClick={(e) => {
            stop(e);
            void actions.join(event);
          }}
          disabled={busy}
          className="gradient-brand min-h-12 shrink-0 rounded-sheet px-4 font-display text-[18px] font-bold whitespace-nowrap text-white transition-transform active:translate-y-px disabled:opacity-60"
        >
          {busy ? 'Saving…' : "I'm interested"}
        </button>
      )}
    </div>
  );
};

/** Quiet links under the price row: help run it, and show or hide your initial once you're in. */
export const QuietLinks = ({ event }: { event: Event }) => {
  const { state, actions, meta } = useVisitor();
  const cancelled = event.status === 'Cancelled';
  const showsInitial = (meta.faces.get(event.id) ?? []).some((f) => f.uid === state.uid);
  const canHost = canOfferHosting(event) && !cancelled;
  const joined = meta.joined.has(event.id) && !cancelled;
  if (!canHost && !joined) return null;
  const keep = canHost ? keepPerHost(event) : 0;

  return (
    <p className="flex flex-wrap gap-x-5">
      {canHost && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.helpRun(event);
          }}
          className={quietLinkClass}
        >
          {keep >= 1 ? `Help run this · est. €${keep} for a host` : 'Help run this'}
        </button>
      )}
      {joined && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (showsInitial) void actions.hideInitial(event);
            else actions.askInitial(event);
          }}
          className="inline-flex min-h-11 items-center text-[15px] font-semibold text-slate-300 underline underline-offset-4 hover:text-white"
        >
          {showsInitial ? 'Hide my initial' : 'Show my initial'}
        </button>
      )}
    </p>
  );
};

export const EventCard = ({ event }: { event: Event }) => {
  const { actions } = useVisitor();
  const cardRef = useRef<HTMLElement>(null);
  useImpression(cardRef, event.id);

  return (
    <article
      ref={cardRef}
      id={`event-${event.id}`}
      onClick={() => actions.open(event)}
      className="sheet group cursor-pointer overflow-hidden rounded-sheet transition-colors hover:border-slate-500 scroll-mt-24"
    >
      <EventPhoto event={event} className="h-40" />
      <div className="space-y-3 px-4 pt-3 pb-2">
        <div>
          <h3 className="font-display text-[23px] leading-[1.05] font-bold tracking-[-0.01em] text-white">
            <button
              onClick={(e) => {
                e.stopPropagation();
                actions.open(event);
              }}
              className="text-left group-hover:text-brand-secondary"
            >
              {event.title}
            </button>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-slate-300">{event.description}</p>
        </div>
        <PeopleLine event={event} />
        <PriceAndAction event={event} />
        <QuietLinks event={event} />
      </div>
    </article>
  );
};
