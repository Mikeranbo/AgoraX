import React from 'react';
import { Event } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { EventCard } from '../components/EventCard';
import { buildShareUrl, shareCodeFor } from '../data/share';
import { maskPhone } from '../data/contact';
import { hasEnough } from '../data/progress';
import { track } from '../services/analytics';
import { primaryButtonClass } from '../components/ui';

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
        {hasEnough(event) ? 'Share this with someone who would come.' : `Share this — it gets to ${event.minParticipants} sooner.`}
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

  if (!me?.hasContact) {
    return (
      <div className="sheet flex items-center justify-between gap-3 rounded-sheet p-4">
        <p className="text-[15px] text-slate-200">We can't tell you when your events are happening yet.</p>
        <button onClick={() => actions.openSheet('contact')} className="min-h-11 shrink-0 rounded-sheet border border-brand-primary px-4 text-[15px] font-bold text-white hover:bg-brand-action/20">
          Add your number
        </button>
      </div>
    );
  }

  return (
    <div className="sheet space-y-1 rounded-sheet p-4">
      <p className="text-[15px] text-slate-200">
        {me.phone ? `We'll message you on ${maskPhone(me.phone)}` : "We'll email you"} when one of your events is happening.
      </p>
      <button onClick={() => actions.setTab('data')} className="min-h-11 text-[15px] font-semibold text-slate-300 underline underline-offset-4 hover:text-white">
        Privacy & my data
      </button>
    </div>
  );
};

export const MyPicksScreen = () => {
  const { actions, meta } = useVisitor();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-16 sm:px-6 lg:pt-8">
      <h1 className="mb-4 font-display text-[30px] font-bold leading-tight text-white">My picks</h1>

      {meta.picks.length === 0 ? (
        <div className="sheet rounded-sheet p-5 text-center">
          <p className="font-display text-[20px] font-bold text-white">Nothing picked yet</p>
          <p className="mt-1 mb-5 text-[15px] text-slate-300">Tap "I'd join" on anything you'd go to. It costs nothing.</p>
          <button onClick={() => actions.setTab('events')} className={primaryButtonClass}>
            Back to Events
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <ContactStatus />
          {meta.picks.map((event) => (
            <div key={event.id}>
              <EventCard event={event} />
              <ShareRow event={event} />
            </div>
          ))}
        </div>
      )}

      <button onClick={() => actions.openSheet('privacy')} className="mt-6 min-h-11 text-[14px] font-semibold text-slate-400 underline underline-offset-4">
        What we keep and why
      </button>
    </div>
  );
};
