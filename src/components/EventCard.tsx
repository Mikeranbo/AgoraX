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
import { mediaFor } from '../data/media';
import { LoopVideo } from './MediaGallery';
import { useVisitor } from '../state/VisitorProvider';
import { quietLinkClass } from './ui';

/** The quiet link, at the card's smaller size. */
const cardLinkClass = quietLinkClass.replace('min-h-11', 'min-h-9').replace('text-[15px]', 'text-[14px]');
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

/** The first paragraph of a description: the one-line hook the card shows. */
export const hookOf = (description = '') => description.split(/\n\s*\n/)[0];

export const priceLabel = (event: Event) => (event.price === 0 ? 'Free' : `€${event.price}`);

/** "Sat 14 Nov, 19:30 CET" for a scheduled event; proposals have no date yet. */
export const dateLabel = (event: Event) => (isScheduled(event) ? formatEventDate(event.startTime) : 'Date to be confirmed');

/** How wide a card photo is shown: one, two or three columns. */
const CARD_SIZES = '(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw';

/**
 * The event's cover, the first item of its gallery: a photo, or a muted loop that plays while the
 * card is on screen. Its emoji on its own colour when there is none or it fails to load.
 */
export const PhotoBackdrop = ({ event, className = '', children }: { event: Event; className?: string; children?: React.ReactNode }) => {
  const cover = mediaFor(event)[0];
  const [failed, setFailed] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const visible = useInView(box, { amount: 0.6 });
  const accent = event.accent || DEFAULT_ACCENT;
  const fill = 'absolute inset-0 h-full w-full object-cover';
  const still = cover?.kind === 'image' ? cover.src : cover?.poster;

  return (
    <div ref={box} className={`relative overflow-hidden ${className}`} style={{ backgroundColor: `color-mix(in srgb, ${accent} 55%, #0f172a)` }}>
      {cover?.kind === 'video' && !failed ? (
        <LoopVideo item={cover} active={visible} sizes={CARD_SIZES} />
      ) : still && !failed ? (
        <img
          src={still}
          srcSet={cover?.kind === 'image' ? cover.srcSet : cover?.posterSrcSet}
          sizes={CARD_SIZES}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className={fill}
        />
      ) : (
        <span aria-hidden="true" className="absolute inset-0 grid place-items-center text-6xl">{event.emoji}</span>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/85 via-transparent to-[#0f172a]/30" />
      {children}
    </div>
  );
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full bg-[#0f172a]/80 px-2.5 py-0.5 text-[12px] leading-5 font-semibold text-white">{children}</span>
);

/** "Confirmed" only when an admin confirmed it; everything else is labelled a proposal. */
export const StatusChip = ({ event }: { event: Event }) =>
  isConfirmed(event) ? (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-happening px-2.5 py-0.5 text-[12px] leading-5 font-bold text-brand-dark">
      <Check size={13} strokeWidth={3} aria-hidden="true" /> Confirmed
    </span>
  ) : (
    <span className="rounded-full border border-white/30 bg-[#0f172a]/80 px-2.5 py-0.5 text-[12px] leading-5 font-semibold text-white">Proposal</span>
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
      className="grid size-9 shrink-0 place-items-center rounded-full bg-[#0f172a]/80 text-white hover:bg-[#0f172a]"
    >
      {saved ? <BookmarkCheck size={20} className="text-brand-secondary" /> : <Bookmark size={20} />}
    </button>
  );
};

/** Category, "Proposal"/"Confirmed" and "Spring trip" top left, the save toggle top right. */
export const PhotoBadges = ({ event, save = true }: { event: Event; save?: boolean }) => (
  <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between gap-2">
    <span className="flex flex-wrap gap-1.5 pt-1.5">
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
    <span className="absolute right-2.5 bottom-2.5">
      <Chip>
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock size={13} aria-hidden="true" /> {dateLabel(event)}
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
          className="grid size-6 place-items-center rounded-full font-display text-[12px] font-bold text-brand-dark ring-2 ring-[#171c36]"
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

/**
 * Sign-ups toward the minimum the event needs: "7 of 12 needed to run" from real sign-ups, the
 * shown initials, and a thin bar. At the target it says "Goal reached", still not confirmed.
 */
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
      <div className="mb-1.5 flex min-h-6 items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-[13px] leading-tight text-slate-300 tabular-nums">
          <Users size={14} className="shrink-0 text-x-blue" aria-hidden="true" />
          {confirmed ? (
            <span>
              <span className="font-semibold text-white">{count} interested</span> · target {event.minParticipants}
            </span>
          ) : reached ? (
            <span>
              <span className="font-semibold text-white">Goal reached</span> · {count} interested · not confirmed yet
            </span>
          ) : (
            <span>
              <span className="font-semibold text-white">
                {count} of {event.minParticipants}
              </span>{' '}
              needed to run
            </span>
          )}
        </p>
        <Avatars faces={meta.faces.get(event.id) ?? []} />
      </div>
      <div
        className="h-[5px] overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Interest toward the target"
        aria-valuetext={progressLabel(event)}
        aria-valuemin={0}
        aria-valuemax={event.minParticipants}
        aria-valuenow={count}
      >
        <motion.div
          className={`h-full origin-left rounded-full ${confirmed ? 'bg-happening' : 'bg-gradient-to-r from-x-blue to-x-purple'}`}
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
          className={`font-display leading-none font-extrabold tracking-[-0.02em] text-white tabular-nums ${size === 'large' ? 'text-[40px]' : 'text-[24px]'}`}
        >
          {priceLabel(event)}
        </span>
        {event.price > 0 && <span className="mt-0.5 text-[11px] text-slate-400">indicative price</span>}
      </p>
      {event.status === 'Cancelled' ? (
        <p className="text-[15px] text-slate-300">Cancelled</p>
      ) : meta.joined.has(event.id) ? (
        <div className="flex items-center gap-1">
          <p className="flex min-h-10 items-center gap-1.5 rounded-xl border border-brand-primary/60 bg-brand-action/20 px-3 font-display text-[15px] font-bold text-white">
            <Check size={16} strokeWidth={3} aria-hidden="true" /> Interested
          </p>
          <button
            onClick={(e) => {
              stop(e);
              void actions.leave(event);
            }}
            disabled={busy}
            aria-label={`Withdraw interest in ${event.title}`}
            className="min-h-10 px-2 text-[14px] font-semibold text-slate-300 underline underline-offset-4 hover:text-white disabled:opacity-50"
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
          className="gradient-brand min-h-10 shrink-0 rounded-xl px-4 font-display text-[15px] font-bold whitespace-nowrap text-white transition-transform active:translate-y-px disabled:opacity-60"
        >
          {busy ? 'Saving…' : "I'm interested"}
        </button>
      )}
    </div>
  );
};

/** "est. €84 for a host" when hosting pays something, else nothing. */
export const hostEstimate = (event: Event): string => {
  const keep = canOfferHosting(event) ? keepPerHost(event) : 0;
  return keep >= 1 ? `est. €${keep}` : '';
};

/** Once you're interested: show or hide your first initial on this event. */
export const InitialToggle = ({ event, small = false }: { event: Event; small?: boolean }) => {
  const { state, actions, meta } = useVisitor();
  if (!meta.joined.has(event.id) || event.status === 'Cancelled') return null;
  const showsInitial = (meta.faces.get(event.id) ?? []).some((f) => f.uid === state.uid);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (showsInitial) void actions.hideInitial(event);
        else actions.askInitial(event);
      }}
      className={`inline-flex items-center font-semibold text-slate-300 underline underline-offset-4 hover:text-white ${small ? 'min-h-9 text-[13px]' : 'min-h-11 text-[15px]'}`}
    >
      {showsInitial ? 'Hide my initial' : 'Show my initial'}
    </button>
  );
};

/** Quiet links under the price row: organize (opens the event page), and show or hide your initial. */
export const QuietLinks = ({ event }: { event: Event }) => {
  const { actions, meta } = useVisitor();
  const cancelled = event.status === 'Cancelled';
  const canHost = canOfferHosting(event) && !cancelled;
  const joined = meta.joined.has(event.id) && !cancelled;
  if (!canHost && !joined) return null;
  const estimate = hostEstimate(event);

  return (
    <p className="-mt-1 flex flex-wrap gap-x-5">
      {canHost && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.open(event);
          }}
          className={cardLinkClass}
        >
          {estimate ? `Organize · ${estimate} for a host` : 'Organize'}
        </button>
      )}
      <InitialToggle event={event} small />
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
      className="group cursor-pointer scroll-mt-16 rounded-[18px] bg-[#12163a]/80 lg:scroll-mt-24"
    >
      <EventPhoto event={event} className="aspect-[2/1] rounded-[18px] ring-1 ring-white/10 transition-shadow group-hover:ring-white/30" />
      <div className="space-y-2.5 px-3 pt-2.5 pb-1.5">
        <div>
          <h3 className="font-display text-[19px] leading-[1.15] font-bold tracking-[-0.01em] text-white">
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
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-snug text-slate-300">{hookOf(event.description)}</p>
        </div>
        <PeopleLine event={event} />
        <PriceAndAction event={event} />
        <QuietLinks event={event} />
      </div>
    </article>
  );
};
