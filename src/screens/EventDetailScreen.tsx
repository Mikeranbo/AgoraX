import React, { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Event, PublicProfile } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { PeopleLine, PhotoBackdrop, PhotoBadges, PriceAndAction, QuietLinks, dateLabel } from '../components/EventCard';
import { formatDuration } from '../data/earnings';
import { cityOf } from '../data/location';
import { subscribeProfile } from '../services/profileService';
import { ProfileImage } from '../components/Avatar';

const Fact = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-sheet-line py-2.5 last:border-0">
    <dt className="text-[13px] text-slate-400">{label}</dt>
    <dd className="text-[14px] text-white">{children}</dd>
  </div>
);

/** The organiser who proposed it, as they describe themselves. AgoraX does not verify them. */
const OrganiserCard = ({ publicId }: { publicId: string }) => {
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  useEffect(() => subscribeProfile(publicId, setProfile, () => setProfile(null)), [publicId]);
  const o = profile?.organiser;
  if (!profile || !o?.enabled) return null;
  return (
    <section className="rounded-sheet border border-sheet-line p-4" aria-label="Organiser">
      <div className="flex items-center gap-3">
        <ProfileImage src={profile.avatar} name={o.name || profile.displayName} size={48} />
        <div className="min-w-0">
          <p className="text-[13px] text-slate-400">Proposed by {o.kind === 'organisation' ? 'a group' : 'a student'}</p>
          <p className="truncate font-display text-[19px] font-bold text-white">{o.name || profile.displayName}</p>
        </div>
      </div>
      {o.about && <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-slate-300">{o.about}</p>}
      <p className="mt-2 text-[12px] text-slate-400">Self-described. AgoraX doesn't check organisers.</p>
    </section>
  );
};

/** Everything about one event. No comments: nothing has happened yet to talk about. */
export const EventDetailScreen = ({ event }: { event: Event }) => {
  const { actions } = useVisitor();
  const duration = formatDuration(event.durationHours);
  const hosts = event.hostsNeeded;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-3 pb-44 sm:px-6">
      <button onClick={actions.back} className="-ml-2 mb-3 inline-flex min-h-11 items-center gap-2 px-2 text-[15px] font-semibold text-slate-200 hover:text-white">
        <ArrowLeft size={18} aria-hidden="true" /> Back to proposals
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
          {event.imageCredit && <p className="-mt-2 text-[12px] text-slate-400">{event.imageCredit}</p>}
          <PeopleLine event={event} />
          <p className="max-w-[60ch] whitespace-pre-wrap text-[16px] leading-relaxed text-pretty text-slate-200">{event.description}</p>
          <dl>
            <Fact label="Price">
              {event.price === 0 ? 'Free' : `About €${event.price} per person if it runs (an estimate). Nothing is paid through AgoraX during the pilot.`}
            </Fact>
            <Fact label="When">{dateLabel(event)}</Fact>
            <Fact label="Where">{[event.venueNote, cityOf(event)].filter(Boolean).join(' · ')}</Fact>
            {duration && <Fact label="How long">{duration}</Fact>}
            {event.bringYourOwn && <Fact label="You bring">{event.bringYourOwn}</Fact>}
            <Fact label="Target">{event.minParticipants} interested people before we look at running it</Fact>
            {typeof hosts === 'number' && <Fact label="Hosts">{`Needs ${hosts} host${hosts === 1 ? '' : 's'}`}</Fact>}
          </dl>
          {event.organiserPublicId && <OrganiserCard publicId={event.organiserPublicId} />}
          {event.mapsLink && (
            <a href={event.mapsLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold text-brand-secondary underline underline-offset-4">
              Open in Google Maps <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
          <QuietLinks event={event} />
        </div>
      </article>

      <div className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-2xl">
        <div className="sheet rounded-sheet px-4 py-3">
          <PriceAndAction event={event} size="large" />
          <p className="mt-2 text-[12px] leading-snug text-slate-400">Interest isn't a booking: no payment, and no guarantee it goes ahead.</p>
        </div>
      </div>
    </div>
  );
};
