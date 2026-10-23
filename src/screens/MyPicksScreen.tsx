import React from 'react';
import { Event, PreferredTiming } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { EventCard } from '../components/EventCard';
import { buildShareUrl, shareCodeFor } from '../data/share';
import { maskPhone } from '../data/contact';
import { targetReached } from '../data/progress';
import { track } from '../services/analytics';
import { primaryButtonClass } from '../components/ui';

export const TIMINGS: { value: PreferredTiming; label: string }[] = [
  { value: 'weekday-evening', label: 'Weekday evenings' },
  { value: 'weekend', label: 'Weekends' },
  { value: 'flexible', label: 'Flexible' },
];

const ShareRow = ({ event }: { event: Event }) => {
  const { state, actions } = useVisitor();
  const code = state.me?.shareCode ?? (state.uid ? shareCodeFor(state.uid) : '');
  const url = buildShareUrl(window.location.origin, code, event.id);

  const share = async () => {
    track('share_click', { eventId: event.id });
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      actions.showToast('Link copied.');
    } catch {
      /* the share sheet was closed */
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 px-1 pt-2">
      <p className="text-[14px] text-slate-300">
        {targetReached(event) ? 'Share it with someone who would really go.' : `Know someone who'd go? It needs ${event.minParticipants} interested.`}
      </p>
      <button onClick={share} className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20">
        Share
      </button>
    </div>
  );
};

const ContactStatus = () => {
  const { state, actions } = useVisitor();
  const me = state.me;

  if (!me?.hasContact || !me.consents?.updates) {
    return (
      <div className="sheet flex items-center justify-between gap-3 rounded-sheet p-4">
        <p className="text-[15px] text-slate-200">We can't tell you whether these go ahead yet.</p>
        <button onClick={() => actions.openSheet('contact')} className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20">
          Add a way to reach you
        </button>
      </div>
    );
  }

  return (
    <div className="sheet space-y-1 rounded-sheet p-4">
      <p className="text-[15px] text-slate-200">
        {me.email ? "We'll email you" : me.phone ? `We'll message you on ${maskPhone(me.phone)}` : "We'll contact you"} if one of these goes ahead, is
        cancelled or won't happen.
      </p>
      <button onClick={() => actions.setTab('notifications')} className="min-h-11 text-[15px] font-semibold text-slate-300 underline underline-offset-4 hover:text-white">
        Notification preferences
      </button>
    </div>
  );
};

/** "When would suit you?" Stored privately; only totals reach the organisers. */
const TimingPreference = () => {
  const { state, actions } = useVisitor();
  const current = state.me?.preferredTiming;
  return (
    <fieldset className="sheet rounded-sheet p-4">
      <legend className="sr-only">When would suit you?</legend>
      <p className="font-display text-[18px] font-bold text-white" aria-hidden="true">When would suit you?</p>
      <p className="mt-1 mb-3 text-[13px] text-slate-400">A preference to help us plan, not a promise of a date or of your availability.</p>
      <div className="flex flex-wrap gap-2">
        {TIMINGS.map((t) => (
          <label
            key={t.value}
            className={`flex min-h-11 cursor-pointer items-center rounded-sheet border px-4 text-[15px] font-semibold has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-secondary ${
              current === t.value ? 'border-white bg-white text-brand-dark' : 'border-sheet-line text-slate-300 hover:text-white'
            }`}
          >
            <input type="radio" name="timing" value={t.value} checked={current === t.value} onChange={() => void actions.setTiming(t.value)} className="sr-only" />
            {t.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
};

const Title = ({ children }: { children: React.ReactNode }) => <h1 className="mb-4 font-display text-[30px] leading-tight font-bold text-white">{children}</h1>;

/** The proposals this person said they're interested in. Private: nobody else sees this list. */
export const MyPicksScreen = () => {
  const { state, actions, meta } = useVisitor();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
      <Title>My interests</Title>
      <p className="mb-5 max-w-[60ch] text-[15px] text-slate-300">
        Only you see this list. Being interested isn't a booking, and you can withdraw any time.
      </p>

      {!state.eventsLoaded ? (
        <p role="status" className="text-[15px] text-slate-300">Loading…</p>
      ) : meta.picks.length === 0 ? (
        <div className="sheet rounded-sheet p-5 text-center">
          <p className="font-display text-[20px] font-bold text-white">Nothing here yet</p>
          <p className="mt-1 mb-5 text-[15px] text-slate-300">Tap "I'm interested" on anything you'd really go to. It costs nothing.</p>
          <button onClick={() => actions.setTab('events')} className={primaryButtonClass}>
            See the proposals
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ContactStatus />
          <TimingPreference />
          {meta.picks.map((event) => (
            <div key={event.id}>
              <EventCard event={event} />
              <ShareRow event={event} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Saved for later. Saving doesn't count as interest and doesn't move any numbers. */
export const SavedScreen = () => {
  const { state, actions, meta } = useVisitor();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6">
      <Title>Saved events</Title>
      <p className="mb-5 max-w-[60ch] text-[15px] text-slate-300">A private list to come back to. Saving doesn't count as interest.</p>
      {!state.eventsLoaded ? (
        <p role="status" className="text-[15px] text-slate-300">Loading…</p>
      ) : meta.savedEvents.length === 0 ? (
        <div className="sheet rounded-sheet p-5 text-center">
          <p className="font-display text-[20px] font-bold text-white">Nothing saved</p>
          <p className="mt-1 mb-5 text-[15px] text-slate-300">Tap the bookmark on a proposal to keep it here.</p>
          <button onClick={() => actions.setTab('events')} className={primaryButtonClass}>
            See the proposals
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {meta.savedEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};
