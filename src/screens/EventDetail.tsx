import React, { useEffect, useState } from 'react';
import { ArrowLeft, Bookmark, BookmarkCheck, Check, ExternalLink, ImagePlus, Share2 } from 'lucide-react';
import { Event, EventMedia, PublicProfile } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { InitialToggle, PeopleLine, StatusChip, dateLabel, hostEstimate, priceLabel } from '../components/EventCard';
import { MediaGallery } from '../components/MediaGallery';
import { MediaEditor } from '../components/MediaEditor';
import { Modal } from '../components/Modal';
import { StepArt } from '../components/StepArt';
import { ProfileImage, colourFor } from '../components/Avatar';
import { canOfferHosting, formatDuration } from '../data/earnings';
import { cityOf } from '../data/location';
import { editableMedia, mediaFor } from '../data/media';
import { stepsFor } from '../data/seedEvents';
import { buildShareUrl, shareCodeFor } from '../data/share';
import { subscribeProfile } from '../services/profileService';
import { saveEventMedia } from '../services/mediaService';
import { track } from '../services/analytics';
import { errorClass, primaryButtonClass } from '../components/ui';

/** How far the content card reaches up over the gallery (px). */
const OVERLAP = 96;
const roundButton = 'grid size-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm hover:bg-black/65 min-[760px]:size-11';
/** The feed card's surface, type and spacing, reused for every section. */
const card = 'rounded-[18px] bg-[#12163a]/80 px-4 py-4 min-[760px]:px-6 min-[760px]:py-5';
const heading = 'font-display text-[19px] leading-[1.15] font-bold tracking-[-0.01em] text-white';

/** The organiser who proposed it, as they describe themselves. AgoraX does not verify them. */
const OrganiserCard = ({ publicId }: { publicId: string }) => {
  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  useEffect(() => subscribeProfile(publicId, setProfile, () => setProfile(null)), [publicId]);
  const o = profile?.organiser;
  if (!profile || !o?.enabled) return null;
  return (
    <div className="mt-4 rounded-xl border border-white/10 p-3" aria-label="Organiser">
      <div className="flex items-center gap-3">
        <ProfileImage src={profile.avatar} name={o.name || profile.displayName} size={40} />
        <div className="min-w-0">
          <p className="text-[12px] text-slate-400">Proposed by {o.kind === 'organisation' ? 'a group' : 'a student'}</p>
          <p className="truncate text-[15px] font-bold text-white">{o.name || profile.displayName}</p>
        </div>
      </div>
      {o.about && <p className="mt-2 max-w-[60ch] text-[13.5px] leading-snug text-slate-300">{o.about}</p>}
      <p className="mt-2 text-[12px] text-slate-400">Self-described. AgoraX doesn't check organisers.</p>
    </div>
  );
};

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
          <span key={f.uid} className="grid size-8 place-items-center rounded-full text-[13px] font-bold text-[#0c0e24] ring-2 ring-[#12163a]" style={{ backgroundColor: colourFor(f.uid) }}>
            {f.initial.toUpperCase()}
          </span>
        ))}
        {joined && !mineShown && (
          <span className="rounded-full ring-2 ring-[#12163a]" title="You">
            <ProfileImage name={name} size={32} colourKey={state.uid ?? undefined} />
          </span>
        )}
        {Array.from({ length: Math.min(remaining, 4) }, (_, i) => (
          <span key={i} className="size-8 rounded-full border-2 border-dashed border-white/30 bg-[#12163a]" />
        ))}
      </span>
      <span className="text-[13.5px] font-semibold text-slate-200">{remaining > 0 ? `${remaining} more needed to run` : 'Goal reached, not confirmed yet'}</span>
    </div>
  );
};

/** The event's organiser (or an admin) changes its photos and videos here. */
const EditMedia = ({ event, onClose }: { event: Event; onClose: () => void }) => {
  const [media, setMedia] = useState<EventMedia[]>(() => editableMedia(event));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true);
    setError('');
    try {
      await saveEventMedia(event.id, media);
      onClose();
    } catch {
      setError("Couldn't save. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <MediaEditor value={media} onChange={setMedia} eventId={event.id} title={event.title} category={event.category} />
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button onClick={() => void save()} disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Save photos and videos'}
      </button>
    </div>
  );
};

/**
 * One opened event. The gallery fills the top edge to edge; the content card reaches up over its
 * bottom and fades into it, so photo and text read as one piece. Below it, the same card style as
 * the feed: sign-up, about, how it works and the details.
 */
export const EventDetail = ({ event }: { event: Event }) => {
  const { state, actions, meta } = useVisitor();
  const [organizeNote, setOrganizeNote] = useState(false);
  const [editing, setEditing] = useState(false);
  const joined = meta.joined.has(event.id);
  const saved = meta.saved.has(event.id);
  const busy = state.pending.has(event.id);
  const cancelled = event.status === 'Cancelled';
  const count = Math.max(0, event.participantsCount || 0);
  const remaining = Math.max(0, event.minParticipants - count);
  const canHost = canOfferHosting(event) && !cancelled;
  const estimate = hostEstimate(event);
  const duration = formatDuration(event.durationHours);
  const where = [event.venueNote, cityOf(event)].filter(Boolean).join(' · ');
  const [hook, ...about] = (event.description || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const steps = stepsFor(event.slug ?? event.id);
  const media = mediaFor(event);
  const canEditMedia = state.isAdmin || (!!event.organiserPublicId && event.organiserPublicId === state.me?.publicId);

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
    <div className="pb-16 text-white">
      <div className="relative">
        <MediaGallery
          items={media}
          title={event.title}
          emoji={event.emoji}
          accent={event.accent}
          chrome={OVERLAP}
          className="h-[min(62svh,560px)] min-h-[320px] min-[760px]:h-[min(74vh,720px)]"
        />
        <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 p-3 min-[760px]:p-5">
          <button onClick={actions.back} aria-label="Back to all proposals" className={roundButton}>
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <div className="flex gap-2">
            {canEditMedia && (
              <button onClick={() => setEditing(true)} aria-label="Edit photos and videos" className={roundButton}>
                <ImagePlus size={20} aria-hidden="true" />
              </button>
            )}
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
      </div>

      <div className="relative z-10 mx-auto max-w-[760px] min-[760px]:px-6" style={{ marginTop: -OVERLAP }}>
        {/* Transparent over the gallery, then the card colour, then fading out again: no edges. */}
        <header
          className="px-4 pt-6 pb-8 min-[760px]:px-6"
          style={{
            background: `linear-gradient(180deg, rgba(18,22,58,0) 0px, rgba(18,22,58,.9) ${OVERLAP - 24}px, #12163a ${OVERLAP + 24}px, #12163a calc(100% - 56px), rgba(18,22,58,0) 100%)`,
          }}
        >
          <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
            <StatusChip event={event} />
            <span className="rounded-full bg-[#0f172a]/80 px-2.5 py-0.5 leading-5 font-semibold text-white">{event.category}</span>
            {event.season === 'spring' && <span className="rounded-full bg-[#0f172a]/80 px-2.5 py-0.5 leading-5 font-semibold text-white">Spring trip</span>}
            <span className="px-1 font-semibold text-slate-300">{dateLabel(event)}</span>
          </div>
          <h1 className="mt-2 font-display text-[28px] leading-[1.08] font-bold tracking-[-0.02em] text-white min-[760px]:text-[40px]">{event.title}</h1>
          {hook && <p className="mt-2 max-w-[60ch] text-[15px] leading-snug text-slate-200 min-[760px]:text-[17px]">{hook}</p>}
          <div className="mt-4">
            <PeopleLine event={event} />
          </div>
        </header>

        <div className="mt-2 space-y-6 px-4 min-[760px]:px-0">
          <section aria-labelledby="signup-heading" className={card}>
            <h2 id="signup-heading" className="sr-only">Sign up</h2>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <p>
                <span className="block font-display text-[44px] leading-none font-extrabold tracking-[-0.02em] text-white tabular-nums">{priceLabel(event)}</span>
                <span className="mt-1 block text-[12px] text-slate-400">{event.price > 0 ? 'indicative price per person' : 'free to join'}</span>
              </p>
              {cancelled ? (
                <p className="text-[15px] text-slate-300">This one is cancelled.</p>
              ) : (
                <button
                  onClick={() => void (joined ? actions.leave(event) : actions.join(event))}
                  disabled={busy}
                  aria-pressed={joined}
                  className={`inline-flex min-h-12 items-center gap-2 rounded-xl px-5 font-display text-[17px] font-bold text-white disabled:opacity-60 ${
                    joined ? 'border border-brand-primary/60 bg-brand-action/20' : 'gradient-brand'
                  }`}
                >
                  {busy ? 'Saving…' : joined ? <><Check size={18} strokeWidth={3} aria-hidden="true" /> Interested · withdraw</> : "I'm interested"}
                </button>
              )}
            </div>
            <div className="mt-4">
              <People event={event} remaining={remaining} />
            </div>
            {canHost && (
              <button
                onClick={() => {
                  actions.helpRun(event);
                  setOrganizeNote(true);
                }}
                className="mt-4 inline-flex min-h-10 items-center rounded-xl border border-white/30 px-4 text-[15px] font-bold text-white hover:border-white/60 hover:bg-white/5"
              >
                {estimate ? `Organize · ${estimate} for a host` : 'Organize'}
              </button>
            )}
            {organizeNote && (
              <p role="status" className="mt-2 max-w-[52ch] text-[14px] font-semibold text-white">
                We'll contact you about a possible collaboration. This doesn't make you the organiser.
              </p>
            )}
            <div className="mt-2">
              <InitialToggle event={event} small />
            </div>
            <p className="mt-2 text-[12px] text-slate-400">
              Prices and potential earnings are hypothetical, not promises. Interest isn't a booking: no payment, and no guarantee it goes ahead.
            </p>
          </section>

          {about.length > 0 && (
            <section aria-labelledby="about-heading" className={card}>
              <h2 id="about-heading" className={heading}>About</h2>
              <div className="mt-2 max-w-[65ch] space-y-3 text-[15px] leading-relaxed text-slate-200">
                {about.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="how-heading" className={card}>
            <h2 id="how-heading" className={heading}>How it works</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((s, i) => (
                <li key={s.title} className="flex items-center gap-3">
                  <StepArt icon={s.icon} index={i} size={60} />
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold text-white">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.title}
                    </p>
                    <p className="text-[13.5px] leading-snug text-slate-300">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="details-heading" className={card}>
            <h2 id="details-heading" className={heading}>Details</h2>
            <dl className="mt-3 grid grid-cols-[7.5rem_1fr] gap-x-4 gap-y-2.5 text-[14px] min-[760px]:grid-cols-[9rem_1fr]">
              {where && (
                <>
                  <dt className="text-slate-400">Where</dt>
                  <dd className="text-white">{where}</dd>
                </>
              )}
              {duration && (
                <>
                  <dt className="text-slate-400">Duration</dt>
                  <dd className="text-white">{duration}</dd>
                </>
              )}
              <dt className="text-slate-400">Price</dt>
              <dd className="text-white">
                {event.price === 0 ? 'Free' : <><span className="font-display text-[19px] font-extrabold">€{event.price}</span> per person if it runs (an estimate). Nothing is paid through AgoraX during the pilot.</>}
              </dd>
              {event.bringYourOwn && (
                <>
                  <dt className="text-slate-400">What to bring</dt>
                  <dd className="text-white">{event.bringYourOwn}</dd>
                </>
              )}
              <dt className="text-slate-400">When</dt>
              <dd className="text-white">{dateLabel(event)}</dd>
              <dt className="text-slate-400">Needed to run</dt>
              <dd className="text-white">{event.minParticipants} interested people</dd>
              {typeof event.hostsNeeded === 'number' && (
                <>
                  <dt className="text-slate-400">Hosts</dt>
                  <dd className="text-white">{`${event.hostsNeeded} host${event.hostsNeeded === 1 ? '' : 's'}`}</dd>
                </>
              )}
            </dl>
            {event.mapsLink && (
              <a href={event.mapsLink} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-10 items-center gap-2 text-[14px] font-semibold text-x-cyan underline underline-offset-4">
                Open in Google Maps <ExternalLink size={16} aria-hidden="true" />
              </a>
            )}
            {event.organiserPublicId && <OrganiserCard publicId={event.organiserPublicId} />}
          </section>
        </div>
      </div>

      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Photos and videos">
        {editing && <EditMedia event={event} onClose={() => setEditing(false)} />}
      </Modal>
    </div>
  );
};
