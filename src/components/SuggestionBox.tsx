import React, { useState } from 'react';
import { submitSuggestion } from '../services/firebaseService';
import { track } from '../services/analytics';
import { errorClass, fieldClass } from './ui';

/** "An event you'd join that isn't here?" → suggestions/{autoId}. Anonymous: no contact asked. */
export const SuggestionBox = () => {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setState('busy');
    try {
      await submitSuggestion({ text });
      track('suggestion_submit', { length: text.trim().length });
      setText('');
      setState('done');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  return (
    <section className="sheet rounded-sheet p-4 sm:p-6">
      <h2 className="mb-3 font-display text-[20px] font-bold text-white">Something you'd go to that isn't here?</h2>
      {state === 'done' ? (
        <p className="text-[15px] text-slate-200">
          Thanks, we read every one.{' '}
          <button className="min-h-11 font-semibold text-brand-secondary underline underline-offset-4" onClick={() => setState('idle')}>
            Add another
          </button>
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label htmlFor="suggestion" className="sr-only">Your idea</label>
          <textarea
            id="suggestion"
            className={`${fieldClass} min-h-[88px]`}
            placeholder="Salsa night, a pub quiz, a trip to Schiermonnikoog…"
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {state === 'error' && <p role="alert" className={errorClass}>That didn't send. Try again in a moment.</p>}
          <button
            type="submit"
            disabled={state === 'busy' || !text.trim()}
            className="min-h-11 rounded-sheet border border-brand-primary px-5 text-[15px] font-bold text-white hover:bg-brand-action/20 disabled:opacity-50"
          >
            {state === 'busy' ? 'Sending…' : 'Send idea'}
          </button>
        </form>
      )}
    </section>
  );
};
