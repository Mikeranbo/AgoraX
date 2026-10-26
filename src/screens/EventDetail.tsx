import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, CalendarClock, Check, Clock, ExternalLink, MapPin, Share2 } from 'lucide-react';
import { Event, PublicProfile } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { InitialToggle, dateLabel, hostEstimate, priceLabel } from '../components/EventCard';
import { Photo } from '../components/Photo';
import { ProfileImage, colourFor } from '../components/Avatar';
import { canOfferHosting, formatDuration, keepPerHost } from '../data/earnings';
import { isScheduled } from '../data/schedule';
import { cityOf } from '../data/location';
import { ownPhoto, photoSet } from '../data/photos';
import { buildShareUrl, shareCodeFor } from '../data/share';
import { subscribeProfile } from '../services/profileService';
import { track } from '../services/analytics';

const ENTRY_FONT = { fontFamily: 'var(--font-entry)' } as const;
const BRAND_FONT = { fontFamily: 'var(--font-brand)' } as const;
const roundButton = 'grid size-9 place-items-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-sm hover:border-white/60 min-[760px]:size-11';

/** The organiser who proposed it, as they describe themselves. AgoraX does not verify them. */
const OrganiserCard = ({ publicId }: { publicId: string }) => {
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  useEffect(() => subscribeProfile(publicId, setProfile, () => setProfile(null)), [publicId]);
  const o = profile?.organiser;
  if (!profile || !o?.enabled) return null;
  return (
    <section className="rounded-2xl border border-white/15 p-4" aria-label="Organiser">
      <div className="flex items-center gap-3">
        <ProfileImage src={profile.avatar} name={o.name || profile.displayName} size={48} />
        <div className="min-w-0">
          <p className="text-[13px] text-x-muted">Proposed by {o.kind === 'organisation' ? 'a group' : 'a student'}</p>
          <p className="truncate text-[19px] font-bold text-white">{o.name || profile.displayName}</p>
        </div>
      </div>
      {o.about && <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-x-text">{o.about}</p>}
      <p className="mt-2 text-[12px] text-x-muted">Self-described. AgoraX doesn't check organisers.</p>
    </section>
  );
};

/** Full-bleed photo with the soft-light tint and the fades into the dark page. */
const Backdrop = ({ event }: { event: Event }) => {
  const own = ownPhoto(event);
  const set = own ? undefined : photoSet(event.slug);
  const image = 'absolute inset-0 h-full w-full object-cover object-[60%_40%] min-[760px]:object-[72%_40%]';
  return (
    <div aria-hidden="true" className="relative h-[62dvh] overflow-hidden min-[760px]:absolute min-[760px]:inset-0 min-[760px]:h-auto">
      {own ? (
        <img src={own} alt="" className={image} />
      ) : set ? (
        <Photo set={set} sizes="100vw" priority className={image} />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-8xl">{event.emoji}</span>
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(124,92,246,.5), rgba(47,110,255,.35))', mixBlendMode: 'soft-light' }} />
      {/* Phone: fade down into the content below. Wider: fade left behind the text, and top and bottom. */}
      <div className="absolute inset-0 min-[760px]:hidden" style={{ background: 'linear-gradient(180deg, rgba(7,8,26,.7) 0%, transparent 22%, transparent 55%, #07081A 100%)' }} />
      <div
        className="absolute inset-0 max-[759px]:hidden"
        style={{
          background:
            'linear-gradient(0deg, #07081A 0%, transparent 34%), linear-gradient(180deg, rgba(7,8,26,.7) 0%, transparent 22%), linear-gradient(90deg,#07081A 0%,rgba(7,8,26,.94) 26%,rgba(7,8,26,.5) 52%,rgba(7,8,26,.05) 78%)',
        }}
      />
    </div>
  );
};

const Pill = ({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) => (
  <span className="inline-flex min-h-9 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3.5 text-[14px] font-medium text-x-text">
    <Icon size={16} aria-hidden="true" className="text-x-cyan" /> {children}
  </span>
);

const Stat = ({ label, value, small }: { label: string; value: string; small?: string }) => (
  <div>
    <p className="entry-headline text-[34px] text-white tabular-nums min-[760px]:text-[54px]" style={{ lineHeight: 1 }}>
      {value}
      {small && <span className="text-[18px] text-x-muted min-[760px]:text-[24px]">{small}</span>}
    </p>
    <p className="mt-1.5 text-[13px] font-semibold text-x-muted">{label}</p>
  </div>
);

/** Who's in so far: shown initials (and yours, if you're interested), then dashed empty places. */
const People = ({ event, remaining }: { event: Event; remaining: number }) => {
  const { state, meta } = useVisitor();
  const faces = meta.faces.get(event.id) ?? [];
  const mineShown = faces.some((f) => f.uid === state.uid);
  const joined = meta.joined.has(event.id);
  const name = state.profile?.displayName ?? state.me?.displayName;
  return (
    <div className="flex items-center gap-3">
      <span className="flex -space-x-2">
        {faces.slice(0, 4).map((f) => (
          <span
            key={f.uid}
            className="grid size-9 place-items-center rounded-full text-[14px] font-bold text-[#0c0e24] ring-2 ring-[#07081A]"
            style={{ backgroundColor: colourFor(f.uid) }}
          >
            {f.initial.toUpperCase()}
          </span>
        ))}
        {joined && !mineShown && (
          <span className="rounded-full ring-2 ring-[#07081A]" title="You">
            <ProfileImage name={name} size={36} colourKey={state.uid ?? undefined} />
          </span>
        )}
        {Array.from({ length: Math.min(remaining, 4) }, (_, i) => (
          <span key={i} className="size-9 rounded-full border-2 border-dashed border-white/35 bg-[#07081A]" />
        ))}
      </span>
      <span className="text-[14px] font-semibold text-x-text">
        {remaining > 0 ? `${remaining} more to reach the target` : 'Target reached'}
      </span>
    </div>
  );
};

/**
 * One opened event, "Cinematic": the photo full screen, the story on the left, the numbers along
 * the bottom. Everything the old detail page showed stays below.
 */
export const EventDetail = ({ event }: { event: Event }) => {
  const { state, actions, meta } = useVisitor();
  const [organizeNote, setOrganizeNote] = useState(false);
  const joined = meta.joined.has(event.id);
  const saved = meta.saved.has(event.id);
  const busy = state.pending.has(event.id);
  const cancelled = event.status === 'Cancelled';
  const count = Math.max(0, event.participantsCount || 0);
  const remaining = Math.max(0, event.minParticipants - count);
  const canHost = canOfferHosting(event) && !cancelled;
  const keep = canOfferHosting(event) ? keepPerHost(event) : 0;
  const estimate = hostEstimate(event);
  const duration = formatDuration(event.durationHours);
  const where = [event.venueNote, cityOf(event)].filter(Boolean).join(' · ');
  const eyebrow = [isScheduled(event) ? 'Scheduled' : 'Proposal', event.category].join(' · ') + ' • ' + (isScheduled(event) ? dateLabel(event) : 'Date to be confirmed');

  const share = async () => {
    const code = state.me?.shareCode ?? (state.uid ? shareCodeFor(state.uid) : '');
    const url = buildShareUrl(window.location.origin, code, event.id);
    track('share_click', { eventId: event.id });
    try {
      if (navigator.share) return void (await navigator.share({ title: event.title, url }));
      await navigator.clipboard.writeText(url);
      actions.showToast('Link copied.');
    } catch {
      /* the share sheet was closed */
    }
  };

  return (
    <div className="bg-[#07081A] text-white" style={ENTRY_FONT}>
      <section className="relative overflow-hidden min-[760px]:min-h-dvh">
        <Backdrop event={event} />

        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-4 min-[760px]:px-14 min-[760px]:pt-6">
          <button
            onClick={actions.back}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-black/40 px-4 text-[15px] font-extrabold backdrop-blur-sm hover:border-white/60"
            style={BRAND_FONT}
          >
            <ArrowLeft size={18} aria-hidden="true" /> All proposals
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => void actions.toggleSaved(event)}
              aria-pressed={saved}
              aria-label={saved ? `Saved: ${event.title}. Remove from saved` : `Save ${event.title}`}
              className={roundButton}
            >
              {saved ? <BookmarkCheck size={20} className="text-x-cyan" /> : <Bookmark size={20} />}
            </button>
            <button onClick={() => void share()} aria-label={`Share ${event.title}`} className={roundButton}>
              <Share2 size={20} />
            </button>
          </div>
        </div>

        <div className="relative z-[1] px-5 pt-2 pb-6 min-[760px]:flex min-[760px]:min-h-dvh min-[760px]:max-w-[700px] min-[760px]:flex-col min-[760px]:justify-center min-[760px]:p-14 min-[760px]:pt-28 min-[760px]:pb-[200px]">
          <p className="text-[13px] font-bold tracking-[0.14em] text-[#C9D2FF] uppercase">{eyebrow}</p>
          <h1 className="entry-headline mt-3 text-white" style={{ fontSize: 'clamp(40px, 5.8vw, 84px)' }}>
            {event.title}
          </h1>
          <div className="mt-5 h-1 w-20 rounded-full" style={{ background: 'linear-gradient(90deg, #5ccfea, #8a6be8)' }} aria-hidden="true" />
          <p className="mt-5 max-w-[60ch] text-[17px] leading-relaxed font-medium text-x-text min-[760px]:text-[20px]">{event.description}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Pill icon={CalendarClock}>{dateLabel(event)}</Pill>
            {where && <Pill icon={MapPin}>{where}</Pill>}
            {duration && <Pill icon={Clock}>{duration}</Pill>}
          </div>

          {cancelled ? (
            <p className="mt-7 text-[16px] text-x-muted">This one is cancelled.</p>
          ) : (
            <div className="mt-7 flex flex-wrap gap-3" style={BRAND_FONT}>
              <button
                onClick={() => void (joined ? actions.leave(event) : actions.join(event))}
                disabled={busy}
                aria-pressed={joined}
                className="gradient-x inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[16px] font-extrabold text-white disabled:opacity-60"
              >
                {busy ? 'Saving…' : joined ? <><Check size={18} strokeWidth={3} aria-hidden="true" /> Interested — withdraw</> : 'I’m interested'}
              </button>
              {canHost && (
                <button
                  onClick={() => {
                    actions.helpRun(event);
                    setOrganizeNote(true);
                  }}
                  className="inline-flex min-h-12 items-center rounded-full border border-white/45 px-6 text-[16px] font-extrabold text-white hover:border-white hover:bg-white/5"
                >
                  {estimate ? `Organize · ${estimate}` : 'Organize'}
                </button>
              )}
            </div>
          )}
          {organizeNote && (
            <p role="status" className="mt-3 max-w-[52ch] text-[15px] font-semibold text-white">
              We’ll contact you about a possible collaboration. This doesn’t make you the organiser.
            </p>
          )}
          <p className="mt-4 text-[13px] text-x-muted">Prices and potential earnings are hypothetical — not promises.</p>
        </div>

        <div className="relative z-[1] border-t border-white/10 px-5 py-5 min-[760px]:absolute min-[760px]:inset-x-0 min-[760px]:bottom-0 min-[760px]:flex min-[760px]:items-end min-[760px]:justify-between min-[760px]:gap-8 min-[760px]:px-14 min-[760px]:py-7">
          <div className="grid grid-cols-3 gap-4 min-[760px]:flex min-[760px]:gap-14">
            <Stat label="Interested" value={String(count)} small={` / ${event.minParticipants}`} />
            <Stat label="Indicative price" value={priceLabel(event)} />
            <Stat label="Est. host earnings" value={keep >= 1 ? `€${keep}` : '—'} />
          </div>
          <div className="mt-5 min-[760px]:mt-0">
            <People event={event} remaining={remaining} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-5 px-5 py-10 text-[15px] text-x-text min-[760px]:px-14" aria-label="More about this event">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[10rem_1fr]">
          {event.bringYourOwn && (
            <>
              <dt className="text-x-muted">You bring</dt>
              <dd className="text-white">{event.bringYourOwn}</dd>
            </>
          )}
          {typeof event.hostsNeeded === 'number' && (
            <>
              <dt className="text-x-muted">Hosts</dt>
              <dd className="text-white">{`Needs ${event.hostsNeeded} host${event.hostsNeeded === 1 ? '' : 's'}`}</dd>
            </>
          )}
          <dt className="text-x-muted">Target</dt>
          <dd className="text-white">{event.minParticipants} interested people before we look at running it</dd>
          <dt className="text-x-muted">Price</dt>
          <dd className="text-white">
            {event.price === 0 ? 'Free' : `About €${event.price} per person if it runs (an estimate). Nothing is paid through AgoraX during the pilot.`}
          </dd>
        </dl>
        {event.organiserPublicId && <OrganiserCard publicId={event.organiserPublicId} />}
        {event.mapsLink && (
          <a href={event.mapsLink} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 font-semibold text-x-cyan underline underline-offset-4">
            Open in Google Maps <ExternalLink size={16} aria-hidden="true" />
          </a>
        )}
        <InitialToggle event={event} />
        <p className="text-[13px] text-x-muted">
          Interest isn't a booking: no payment, and no guarantee it goes ahead.
          {event.imageCredit ? ` ${event.imageCredit}.` : ''}
        </p>
      </section>
    </div>
  );
};
