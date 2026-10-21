import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { submitVenueOffer } from '../services/firebaseService';
import { track } from '../services/analytics';

const inputClass =
  'w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'text-[10px] uppercase font-bold text-slate-500 tracking-widest';

interface VenueOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Form = ({ onClose }: { onClose: () => void }) => {
  const [name, setName] = useState('');
  const [spaceType, setSpaceType] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('busy');
    try {
      await submitVenueOffer({ name, spaceType, contact });
      track('venue_offer_submit', { spaceType: spaceType.trim() });
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
        <input id="vo-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="vo-type">Type of space</label>
        <input
          id="vo-type"
          className={inputClass}
          placeholder="e.g. Rooftop terrace, studio, sports hall"
          value={spaceType}
          onChange={(e) => setSpaceType(e.target.value)}
          required
          maxLength={120}
        />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="vo-contact">WhatsApp or email</label>
        <input id="vo-contact" className={inputClass} value={contact} onChange={(e) => setContact(e.target.value)} required maxLength={120} />
      </div>
      {state === 'error' && <p role="alert" className="text-xs text-red-300">Couldn't send that — please try again.</p>}
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
