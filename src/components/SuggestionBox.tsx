import React, { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { submitSuggestion } from '../services/firebaseService';
import { track } from '../services/analytics';

const inputClass =
  'w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary';

/** "An event you'd join that isn't here?" → suggestions/{autoId}. */
export const SuggestionBox = () => {
  const [text, setText] = useState('');
  const [contact, setContact] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setState('busy');
    try {
      await submitSuggestion({ text, contact });
      track('suggestion_submit', { hasContact: contact.trim() !== '' });
      setText('');
      setContact('');
      setState('done');
    } catch (err) {
      console.error(err);
      setState('error');
    }
  };

  return (
    <section className="glass rounded-3xl p-6 sm:p-8 mt-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-brand-primary/15 text-brand-primary flex items-center justify-center">
          <Lightbulb size={20} />
        </div>
        <h2 className="font-display text-xl font-black text-white">An event you'd join that isn't here?</h2>
      </div>

      {state === 'done' ? (
        <p className="text-sm text-green-300 bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          Thanks — we read every suggestion.{' '}
          <button className="underline font-bold" onClick={() => setState('idle')}>
            Add another
          </button>
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <textarea
            className={`${inputClass} min-h-[90px]`}
            placeholder="Tell us what you'd actually go to…"
            maxLength={500}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
          <input
            className={inputClass}
            placeholder="WhatsApp or email, if you want to hear back (optional)"
            maxLength={120}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          {state === 'error' && (
            <p role="alert" className="text-xs text-red-300">Couldn't send that — please try again.</p>
          )}
          <button
            type="submit"
            disabled={state === 'busy' || !text.trim()}
            className="px-6 py-3 gradient-brand text-white rounded-2xl font-black text-sm disabled:opacity-50"
          >
            {state === 'busy' ? 'Sending…' : 'Send suggestion'}
          </button>
        </form>
      )}
    </section>
  );
};
