import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { submitVenueOffer } from '../services/firebaseService';
import { track } from '../services/analytics';
import { SPACE_TYPES, validateVenueOffer } from '../data/forms';
import { CONSENT_TEXTS } from '../data/consent';
import type { SpaceType } from '../types';

const SPACE_LABELS: Record<SpaceType, string> = { room: 'Room', hall: 'Hall', cafe: 'Café', other: 'Other' };

const inputClass =
  'w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'text-[10px] uppercase font-bold text-slate-500 tracking-widest';

interface VenueOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
      <div className="text-center py-6">
        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-green-400" />
        </div>
        <h3 className="text-xl font-display font-black text-white mb-2">Thanks!</h3>
        <p className="text-slate-400 text-sm mb-6">We'll get in touch if an event needs a space like yours.</p>
        <button onClick={onClose} className="px-8 py-3 bg-white text-brand-dark rounded-2xl font-black text-xs uppercase tracking-widest">
          Done
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-slate-400 text-sm">A room, hall, garden, studio, court — if it's sometimes empty, tell us.</p>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="vo-name">Your name</label>
        <input id="vo-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={labelClass} htmlFor="vo-type">Type of space</label>
          <select
            id="vo-type"
            className={inputClass}
            value={spaceType}
            onChange={(e) => setSpaceType(e.target.value as SpaceType | '')}
          >
            <option value="" className="bg-[#0f172a]">Choose…</option>
            {SPACE_TYPES.map((t) => (
              <option key={t} value={t} className="bg-[#0f172a]">
                {SPACE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className={labelClass} htmlFor="vo-capacity">Fits about</label>
          <input
            id="vo-capacity"
            type="number"
            inputMode="numeric"
            min={1}
            max={5000}
            className={inputClass}
            placeholder="40"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="vo-contact">WhatsApp or email</label>
        <input id="vo-contact" className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} maxLength={120} />
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-brand-secondary shrink-0"
        />
        <span className="text-xs text-slate-300 leading-relaxed">{CONSENT_TEXTS.space}</span>
      </label>
      {problem && <p role="alert" className="text-xs text-red-300">{problem}</p>}
      {state === 'error' && <p role="alert" className="text-xs text-red-300">Couldn't send that. Check your connection and try again.</p>}
      <button
        type="submit"
        disabled={state === 'busy'}
        className="w-full py-3 gradient-brand text-white rounded-2xl font-black text-sm tracking-wide disabled:opacity-60"
      >
        {state === 'busy' ? 'Sending…' : 'Send'}
      </button>
    </form>
  );
};

export const VenueOfferModal = ({ isOpen, onClose }: VenueOfferModalProps) => (
  <Modal isOpen={isOpen} onClose={onClose} title="I have a space">
    <Form onClose={onClose} />
  </Modal>
);
