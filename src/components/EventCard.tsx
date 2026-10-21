import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Clock, Sprout, Check } from 'lucide-react';
import { Event } from '../types';
import { EventCover } from './EventCover';
import { bumpEventCounter } from '../services/firebaseService';
import { track } from '../services/analytics';
import { once } from '../services/session';
import { canOfferHosting, keepPerHost, formatDuration } from '../data/earnings';
import { hasEnough, progressLabel, progressPercent } from '../data/progress';

interface EventCardProps {
  event: Event;
  /** True when events/{id}/participants/{uid} exists for this visitor. */
  joined: boolean;
  busy?: boolean;
  onJoin: (event: Event) => void;
  onLeave: (event: Event) => void;
  onOpen: (event: Event) => void;
  onHelpRun: (event: Event) => void;
}

/**
 * One impression per card per session: an IntersectionObserver fires when the card is
 * actually on screen, and once() (module-scope Set, mirrored to sessionStorage) makes sure
 * filtering, searching and re-rendering can never count it again.
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

export const EventCard: React.FC<EventCardProps> = ({ event, joined, busy, onJoin, onLeave, onOpen, onHelpRun }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  useImpression(cardRef, event.id);

  const enough = hasEnough(event);
  const cancelled = event.status === 'Cancelled';
  const duration = formatDuration(event.durationHours);
  const keep = canOfferHosting(event) ? keepPerHost(event) : null;

  return (
    <motion.div
      ref={cardRef}
      id={`event-${event.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onOpen(event)}
      className="glass rounded-3xl overflow-hidden flex flex-col h-full group cursor-pointer scroll-mt-24"
    >
      <EventCover event={event} className="h-40 shrink-0">
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap pr-24">
          <span className="px-3 py-1 bg-black/30 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/10">
            {event.category}
          </span>
        </div>
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          {event.season === 'spring' && (
            <span className="px-3 py-1 bg-amber-400/20 backdrop-blur-md text-amber-200 border border-amber-300/30 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
              <Sprout size={12} /> Spring trip
            </span>
          )}
          {enough && (
            <span className="px-3 py-1 bg-green-500/20 backdrop-blur-md text-green-300 border border-green-500/30 text-[10px] font-bold rounded-full flex items-center gap-1 uppercase tracking-wider">
              <CheckCircle2 size={12} /> Runs
            </span>
          )}
        </div>
      </EventCover>

      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-display text-xl font-bold text-white leading-tight group-hover:text-brand-secondary transition-colors">
          {event.title}
        </h3>

        <div className="flex items-center gap-3 mt-2 text-sm text-slate-300">
          <span className="font-display font-bold text-white">{event.price === 0 ? 'Free' : `€${event.price}`}</span>
          {duration && (
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <Clock size={12} /> {duration}
            </span>
          )}
        </div>

        <p className="text-slate-400 text-sm line-clamp-2 mt-3 mb-4 flex-grow">{event.description}</p>

        <div className="mb-5">
          <div
            className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/5"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={event.minParticipants}
            aria-valuenow={event.participantsCount || 0}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent(event)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${enough ? 'bg-green-400' : 'bg-gradient-to-r from-brand-primary to-brand-secondary'}`}
            />
          </div>
          <p className="text-xs text-slate-300 font-medium mt-2">{progressLabel(event)}</p>
        </div>

        <div className="space-y-2 mt-auto">
          {cancelled ? (
            <button disabled className="w-full py-3 rounded-2xl font-bold text-sm bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed">
              Cancelled
            </button>
          ) : joined ? (
            <div className="flex items-center gap-2">
              <div className="flex-grow py-3 rounded-2xl font-bold text-sm bg-green-500/15 text-green-300 border border-green-500/30 flex items-center justify-center gap-2">
                <Check size={16} /> You're in
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLeave(event);
                }}
                disabled={busy}
                className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-400 hover:text-white glass transition-colors disabled:opacity-50"
              >
                Leave
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onJoin(event);
              }}
              disabled={busy}
              className="w-full py-3 gradient-brand text-white rounded-2xl font-black text-sm tracking-wide shadow-lg active:scale-95 transition-all disabled:opacity-60"
            >
              {busy ? 'Saving…' : "I'd join"}
            </button>
          )}

          {keep !== null && !cancelled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onHelpRun(event);
              }}
              className="w-full py-2 rounded-xl text-xs font-bold text-brand-secondary glass hover:bg-white/10 transition-colors"
            >
              {keep >= 1 ? `Help run this · keep ~€${keep}` : 'Help run this'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
