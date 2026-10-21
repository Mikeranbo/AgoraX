import React, { useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { ContactForm, ContactValues } from './ContactForm';
import { Event } from '../types';
import { earningsFor, eur } from '../data/earnings';
import { PLATFORM_FEE } from '../data/seedEvents';

interface OrganiserPanelProps {
  event: Event | null;
  hasContact: boolean;
  onClose: () => void;
  /** Records the interest (counter + per-person record). */
  onInterest: (event: Event) => Promise<void>;
  onContact: (values: ContactValues) => Promise<void>;
}

const Row = ({ label, value, strong, muted }: { label: string; value: string; strong?: boolean; muted?: boolean }) => (
  <div className="flex justify-between items-baseline gap-4 py-2 border-b border-white/5 last:border-0">
    <span className={`text-sm ${muted ? 'text-slate-500' : 'text-slate-300'}`}>{label}</span>
    <span className={`font-display ${strong ? 'text-lg font-black text-brand-secondary' : 'font-bold text-white'}`}>{value}</span>
  </div>
);

const PanelBody = ({ event, hasContact, onClose, onInterest, onContact }: Omit<OrganiserPanelProps, 'event'> & { event: Event }) => {
  const [stage, setStage] = useState<'info' | 'contact' | 'done'>('info');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const e = earningsFor(event);
  const hosts = event.hostsNeeded ?? 1;
  const free = event.price === 0;
  const perPersonTotal = (event.perPersonCost ?? 0) * event.minParticipants;

  const interested = async () => {
    setBusy(true);
    setError('');
    try {
      await onInterest(event);
      setStage(hasContact ? 'done' : 'contact');
    } catch (err) {
      console.error(err);
      setError("Couldn't record that — please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'done') {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h3 className="text-xl font-display font-black text-white mb-2">Thanks — you're on the list</h3>
        <p className="text-slate-400 text-sm mb-6">
          If {event.title} gets enough people, we'll get in touch about running it together.
        </p>
        <button onClick={onClose} className="px-8 py-3 bg-white text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest">
          Done
        </button>
      </div>
    );
  }

  if (stage === 'contact') {
    return (
      <div>
        <p className="text-white font-bold mb-1">Your interest in {event.title} is recorded.</p>
        <p className="text-slate-400 text-sm mb-5">Leave a number and we'll message you if it gets enough sign-ups.</p>
        <ContactForm
          submitLabel="Send my details"
          onSkip={() => setStage('done')}
          skipLabel="Skip — I'll leave it there"
          onSubmit={async (values) => {
            await onContact(values);
            setStage('done');
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-slate-400 text-sm mb-1">{event.emoji} {event.title}</p>
      <p className="text-white font-bold mb-5">What a host keeps if exactly {event.minParticipants} people come</p>

      {free ? (
        <div className="p-4 glass rounded-2xl text-sm text-slate-300 mb-5">
          This one is free for everyone, so hosting is for the fun of it — there's nothing to earn, and nothing to pay.
        </div>
      ) : (
        <div className="p-4 glass rounded-2xl mb-5">
          <Row label={`${event.minParticipants} people × ${eur(event.price)}`} value={eur(e.gross)} />
          {(event.fixedCost ?? 0) > 0 && <Row muted label="Fixed costs (room, coach, hire)" value={`− ${eur(event.fixedCost ?? 0)}`} />}
          {(event.perPersonCost ?? 0) > 0 && (
            <Row muted label={`Per-person costs (${event.minParticipants} × ${eur(event.perPersonCost ?? 0)})`} value={`− ${eur(perPersonTotal)}`} />
          )}
          {e.costs === 0 && <Row muted label="Listed costs" value="€0" />}
          <Row muted label={`Platform fee (${Math.round(PLATFORM_FEE * 100)}%)`} value={`− ${eur(Math.round(e.platformFee * 100) / 100)}`} />
          <Row label={`Hosts needed`} value={String(hosts)} />
          <Row strong label="Each host keeps" value={eur(Math.round(e.perHost * 100) / 100)} />
        </div>
      )}

      <ul className="text-xs text-slate-400 space-y-1.5 mb-4">
        {event.venueNote && <li>📍 {event.venueNote}</li>}
        {event.bringYourOwn && <li>🎒 Not included: {event.bringYourOwn}</li>}
      </ul>

      <p className="text-sm text-slate-200 italic mb-3">
        A second host joins automatically above 20 people — the earnings split between you.
      </p>
      <p className="text-sm text-slate-200 italic mb-6">
        If fewer than {event.minParticipants} sign up, nothing is charged — you don't lose anything either.
      </p>

      {error && <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-3">{error}</p>}

      <button
        onClick={interested}
        disabled={busy}
        className="w-full py-4 gradient-brand text-white rounded-2xl font-black text-sm tracking-wide disabled:opacity-60"
      >
        {busy ? 'Saving…' : "I'd help run this"}
      </button>
    </div>
  );
};

export const OrganiserPanel = ({ event, hasContact, onClose, onInterest, onContact }: OrganiserPanelProps) => {
  // Keep the last event around so the sheet's slide-out animation still has content.
  const last = useRef<Event | null>(event);
  if (event) last.current = event;
  const shown = event ?? last.current;

  return (
    <Modal isOpen={!!event} onClose={onClose} title="Help run this">
      {shown && (
        <PanelBody key={shown.id} event={shown} hasContact={hasContact} onClose={onClose} onInterest={onInterest} onContact={onContact} />
      )}
    </Modal>
  );
};
