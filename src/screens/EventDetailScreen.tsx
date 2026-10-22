import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Event } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { PeopleLine, PhotoBackdrop, PhotoBadges, PriceAndAction, QuietLinks } from '../components/EventCard';
import { formatDuration } from '../data/earnings';
import { closesLabel } from '../data/dates';

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-sheet-line py-2.5 last:border-0">
    <dt className="text-[13px] text-slate-400">{label}</dt>
    <dd className="text-[14px] text-white">{children}</dd>
  </div>
);

/** Everything about one event. No comments: nothing has happened yet to talk about. */
export const EventDetailScreen = ({ event }: { event: Event }) => {
  const { actions } = useVisitor();
  const duration = formatDuration(event.durationHours);
  const closes = closesLabel(event.deadline, new Date());
  const hosts = event.hostsNeeded;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-44 sm:px-6">
      <button onClick={actions.back} className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-2 px-2 text-[15px] font-semibold text-slate-200 hover:text-white">
        <ArrowLeft size={18} /> All events
      </button>

      <article className="sheet overflow-hidden rounded-sheet">
        <PhotoBackdrop event={event} className="flex min-h-[min(62dvh,560px)] flex-col justify-end">
          <PhotoBadges event={event} />
          <h1
            className="relative bg-gradient-to-t from-[#0f172a] via-[#0f172a]/75 to-transparent px-4 pt-24 pb-5 font-display leading-[0.92] font-extrabold tracking-[-0.03em] text-balance text-white sm:px-6"
            style={{ fontSize: 'clamp(40px, 10vw, 76px)' }}
          >
            {event.title}
          </h1>
        </PhotoBackdrop>
        <div className="space-y-5 p-4 sm:p-6">
          <PeopleLine event={event} />
          <p className="max-w-[60ch] whitespace-pre-wrap text-[16px] leading-relaxed text-pretty text-slate-200">{event.description}</p>
          <dl>
            <Fact label="Price">{event.price === 0 ? 'Free' : `€${event.price} per person, charged only if it runs`}</Fact>
            {event.venueNote && <Fact label="Where">{event.venueNote}</Fact>}
            {duration && <Fact label="How long">{duration}</Fact>}
            {event.bringYourOwn && <Fact label="You bring">{event.bringYourOwn}</Fact>}
            <Fact label="Runs with">{event.minParticipants} people or more</Fact>
            {closes && <Fact label="Sign-ups">{closes}</Fact>}
            {typeof hosts === 'number' && <Fact label="Hosts">{`Needs ${hosts} host${hosts === 1 ? '' : 's'}`}</Fact>}
          </dl>
          {event.mapsLink && (
            <a href={event.mapsLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-brand-secondary underline underline-offset-4">
              Open in Google Maps <ExternalLink size={16} />
            </a>
          )}
          <QuietLinks event={event} />
        </div>
      </article>

      <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-2xl">
        <div className="sheet rounded-sheet px-4 py-3">
          <PriceAndAction event={event} size="large" />
        </div>
      </div>
    </div>
  );
};
