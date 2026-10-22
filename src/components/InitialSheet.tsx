import React, { useRef, useState } from 'react';
import { Modal } from './Modal';
import { Event } from '../types';
import { useVisitor } from '../state/VisitorProvider';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';

const Body = ({ event }: { event: Event }) => {
  const { state, actions } = useVisitor();
  const [initial, setInitial] = useState((state.me?.name ?? '').trim().charAt(0).toUpperCase());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\p{L}$/u.test(initial)) return setError('Type one letter.');
    setError('');
    setBusy(true);
    try {
      await actions.showInitial(event, initial.toUpperCase());
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-[15px] leading-relaxed text-slate-300">
        Your first initial appears in a small circle on {event.title}, so friends can see you're going. Nothing
        else about you is shown, and you can hide it again any time.
      </p>
      <div>
        <label className={labelClass} htmlFor="initial">Your first initial</label>
        <input
          id="initial"
          maxLength={1}
          autoComplete="off"
          className={`${fieldClass} w-20 text-center font-display text-[22px] font-bold uppercase`}
          value={initial}
          onChange={(e) => setInitial(e.target.value.toUpperCase())}
        />
      </div>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Show it'}
      </button>
    </form>
  );
};

/** Opt-in: a joiner shows their first initial on one event. */
export const InitialSheet = () => {
  const { state, actions } = useVisitor();
  const open = state.sheet === 'initial' && !!state.initialEvent;
  const last = useRef<Event | null>(state.initialEvent);
  if (state.initialEvent) last.current = state.initialEvent;
  const shown = state.initialEvent ?? last.current;

  return (
    <Modal isOpen={open} onClose={actions.closeSheet} title="Show my initial">
      {shown && <Body key={shown.id} event={shown} />}
    </Modal>
  );
};
