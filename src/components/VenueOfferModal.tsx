import React, { useState } from 'react';
import { Modal } from './Modal';
import { submitVenueOffer } from '../services/firebaseService';
import { track } from '../services/analytics';
import { SPACE_TYPES, validateVenueOffer } from '../data/forms';
import { CONSENT_TEXTS } from '../data/consent';
import type { SpaceType } from '../types';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';

const SPACE_LABELS: Record<SpaceType, string> = { room: 'Room', hall: 'Hall', cafe: 'Café', other: 'Other' };

const Form = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [spaceType, setSpaceType] = useState<SpaceType | ''>('');
  const [capacity, setCapacity] = useState('');
  const [contact, setContact] = useState('');
  const [consent, setConsent] = useState(false);
  const [problem, setProblem] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const issue = validateVenueOffer({ name, spaceType, capacity, contact, consent });
    setProblem(issue ?? '');
    if (issue || !spaceType) return;
    setState('busy');
    try {
      await submitVenueOffer({ name, spaceType, capacity: Number(capacity), contact });
      track('venue_offer_submit', { spaceType, capacity: Number(capacity) });
      setState('done');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div className="space-y-5">
        <p className="text-[16px] leading-relaxed text-slate-200">
          Thanks. When an event needs a space like yours, we'll get in touch.
        </p>
        <button onClick={onClose} className={primaryButtonClass}>Done</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-[15px] text-slate-300">A room, hall, café, studio or court that's sometimes empty? Tell us about it.</p>
      <div>
        <label className={labelClass} htmlFor="vo-name">Your name</label>
        <input id="vo-name" autoComplete="name" maxLength={80} className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass} htmlFor="vo-type">Type of space</label>
          <select id="vo-type" className={fieldClass} value={spaceType} onChange={(e) => setSpaceType(e.target.value as SpaceType | '')}>
            <option value="">Choose…</option>
            {SPACE_TYPES.map((t) => (
              <option key={t} value={t}>{SPACE_LABELS[t]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="vo-capacity">Fits about</label>
          <input
            id="vo-capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            placeholder="40"
            className={fieldClass}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className={labelClass} htmlFor="vo-contact">WhatsApp or email</label>
        <input id="vo-contact" maxLength={120} className={fieldClass} value={contact} onChange={(e) => setContact(e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
        <span className="text-[14px] leading-relaxed text-slate-300">{CONSENT_TEXTS.space}</span>
      </label>
      {problem && <p role="alert" className={errorClass}>{problem}</p>}
      {state === 'error' && <p role="alert" className={errorClass}>That didn't send. Check your connection and try again.</p>}
      <button type="submit" disabled={state === 'busy'} className={primaryButtonClass}>
        {state === 'busy' ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
};

export const VenueOfferModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="I have a space">
    <Form onClose={onClose} />
  </Modal>
);
