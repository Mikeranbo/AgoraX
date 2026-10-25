import React, { useRef, useState } from 'react';
import { Modal } from './Modal';
import { Event, RanBefore } from '../types';
import { earningsFor, eur } from '../data/earnings';
import { PLATFORM_FEE } from '../data/seedEvents';
import { CONSENT_TEXTS } from '../data/consent';
import { validateHelperForm } from '../data/forms';
import { submitHelperInterest } from '../services/firebaseService';
import { track } from '../services/analytics';
import { useVisitor } from '../state/VisitorProvider';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';
import { CollectionNotice } from './CollectionNotice';

const money = (n: number) => `€${n.toFixed(2)}`;

const Row = ({ label, value, note, total }: { label: string; value: string; note?: string; total?: boolean }) => (
  <div className={`flex items-baseline justify-between gap-4 py-2 ${total ? 'border-t border-sheet-line mt-1 pt-3' : ''}`}>
    <span className={total ? 'font-display text-[17px] font-bold text-white' : 'text-[15px] text-slate-300'}>
      {label}
      {note && <span className="block text-[13px] text-slate-400">{note}</span>}
    </span>
    <span className={`font-display tabular-nums ${total ? 'text-[22px] font-bold text-brand-secondary' : 'text-[16px] font-semibold text-white'}`}>
      {value}
    </span>
  </div>
);

/** An illustrative estimate at exactly the target headcount, laid out like a receipt. Not an offer. */
const Breakdown = ({ event }: { event: Event }) => {
  const e = earningsFor(event);
  const hosts = event.hostsNeeded ?? 1;
  const min = event.minParticipants;
  return (
    <div>
      {event.price === 0 ? (
        <p className="text-[15px] text-slate-300">
          This one is free for everyone, so there's nothing to earn and nothing to pay. You run it because you'd
          like it to exist.
        </p>
      ) : (
        <div className="rounded-sheet bg-brand-dark px-4 py-2">
          <Row label={`${min} people × ${eur(event.price)}`} value={money(e.gross)} />
          {(event.fixedCost ?? 0) > 0 && <Row label="Fixed costs" note={event.venueNote} value={`− ${money(event.fixedCost ?? 0)}`} />}
          {(event.perPersonCost ?? 0) > 0 && (
            <Row label={`${min} × ${eur(event.perPersonCost ?? 0)} per person`} value={`− ${money((event.perPersonCost ?? 0) * min)}`} />
          )}
          <Row label={`Platform fee ${Math.round(PLATFORM_FEE * 100)}%`} value={`− ${money(e.platformFee)}`} />
          <Row total label={hosts > 1 ? 'Each host might keep' : 'A host might keep'} value={`~${money(e.perHost)}`} />
        </div>
      )}
      {event.price > 0 && (
        <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
          An illustrative estimate, not a confirmed offer or guaranteed income. Real costs, prices and numbers decide it, and AgoraX takes no
          payments during the pilot.
        </p>
      )}
      <p className="mt-4 text-[15px] leading-relaxed text-slate-300">
        Needs {hosts} host{hosts === 1 ? '' : 's'}. Above 20 people a second host would be needed, and any earnings would be
        split between you.
      </p>
      <p className="mt-2 text-[15px] leading-relaxed text-white">
        Offering to help commits you to nothing yet. If it doesn't go ahead, you don't lose anything.
      </p>
    </div>
  );
};

const RAN_BEFORE: { value: RanBefore; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'sort-of', label: 'Sort of' },
  { value: 'no', label: 'No' },
];

const HelperForm = ({ event, onDone }: { event: Event; onDone: () => void }) => {
  const { state } = useVisitor();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [ranBefore, setRanBefore] = useState<RanBefore | ''>('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = validateHelperForm({ firstName, phone, email, ranBefore, consent });
    setError(problem ?? '');
    if (problem || !ranBefore || !state.uid) return;
    setBusy(true);
    try {
      await submitHelperInterest(event.id, state.uid, { firstName, phone, email, ranBefore });
      track('organiser_interest_click', { eventId: event.id, ranBefore });
      onDone();
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className={labelClass} htmlFor="hf-name">First name</label>
        <input id="hf-name" autoComplete="given-name" maxLength={80} className={fieldClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="hf-email">Email</label>
        <input id="hf-email" type="email" autoComplete="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="hf-phone">or WhatsApp number</label>
        <input id="hf-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" className={fieldClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <fieldset>
        <legend className={labelClass}>Have you run something like this before?</legend>
        <div className="grid grid-cols-3 gap-2">
          {RAN_BEFORE.map((o) => (
            <label
              key={o.value}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-sheet border text-[15px] font-semibold ${
                ranBefore === o.value ? 'border-brand-primary bg-brand-action/20 text-white' : 'border-sheet-line text-slate-300'
              }`}
            >
              <input type="radio" name="ran-before" value={o.value} checked={ranBefore === o.value} onChange={() => setRanBefore(o.value)} className="sr-only" />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
        <span className="text-[14px] leading-relaxed text-slate-300">{CONSENT_TEXTS.organising}</span>
      </label>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Sending…' : 'Send'}
      </button>
      <CollectionNotice>This keeps your first name, the email or number you give, and your answer.</CollectionNotice>
    </form>
  );
};

const PanelBody = ({ event, onClose }: { event: Event; onClose: () => void }) => {
  const [stage, setStage] = useState<'info' | 'form' | 'done'>('info');

  if (stage === 'done') {
    return (
      <div className="space-y-5">
        <p className="text-[16px] leading-relaxed text-slate-200">
          Thanks, you're on the list of possible hosts for {event.title}. If it gets close to {event.minParticipants} interested
          people and we think we can run it, we'll get in touch to talk it through. Nothing is agreed until then.
        </p>
        <button onClick={onClose} className={primaryButtonClass}>Done</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-[15px] text-slate-300">
        {event.emoji} {event.title}: an estimate of what a host might keep if exactly {event.minParticipants} people came.
      </p>
      <Breakdown event={event} />
      {stage === 'info' ? (
        <button onClick={() => setStage('form')} className={primaryButtonClass}>
          I'd help run this
        </button>
      ) : (
        <HelperForm event={event} onDone={() => setStage('done')} />
      )}
    </div>
  );
};

/** Opens from "Organize" on the event page. */
export const OrganiserPanel = () => {
  const { state, actions } = useVisitor();
  const event = state.organiserEvent;
  // Keep the last event so the sheet still has content while it slides away.
  const last = useRef<Event | null>(event);
  if (event) last.current = event;
  const shown = event ?? last.current;

  return (
    <Modal isOpen={!!event} onClose={actions.closeOrganiser} title="Organize this event">
      {shown && <PanelBody key={shown.id} event={shown} onClose={actions.closeOrganiser} />}
    </Modal>
  );
};
