import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Event } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { EventBand, HelpRunLink, JoinActions } from '../components/EventCard';
import { SignupList } from '../components/SignupList';
import { formatDuration } from '../data/earnings';
import { closesLabel } from '../data/dates';

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[7.5rem_1fr] gap-3 border-b border-sheet-line py-3 last:border-0">
    <dt className="text-[14px] text-slate-400">{label}</dt>
    <dd className="text-[15px] text-white">{children}</dd>
  </div>
);

/** Everything about one event. No comments: nothing has happened yet to talk about. */
export const EventDetailScreen = ({ event }: { event: Event }) => {
  const { actions, meta } = useVisitor();
  const duration = formatDuration(event.durationHours);
  const closes = closesLabel(event.deadline, new Date());
  const hosts = event.hostsNeeded;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-40 sm:px-6">
      <button onClick={actions.back} className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-2 px-2 text-[15px] font-semibold text-slate-300 hover:text-white">
        <ArrowLeft size={18} /> All events
      </button>

      <article className="sheet overflow-hidden rounded-sheet">
        <EventBand event={event}>
          <p className="text-[13px] font-semibold text-white/90">{event.category}</p>
          <h1 className="font-display text-[26px] font-bold leading-tight text-white">{event.title}</h1>
        </EventBand>
        <div className="space-y-5 p-4 sm:p-5">
          <SignupList event={event} joined={meta.joined.has(event.id)} />
          <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-slate-200">{event.description}</p>
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
          <HelpRunLink event={event} />
        </div>
      </article>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-sheet-line bg-brand-dark px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-2xl">
          <JoinActions event={event} />
        </div>
      </div>
    </div>
  );
};
