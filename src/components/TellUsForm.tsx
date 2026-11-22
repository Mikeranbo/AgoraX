import React, { useState } from 'react';
import { CONSENT_TEXTS, ConsentPurpose } from '../data/consent';
import { contactProblem } from '../data/forms';
import { submitSuggestion } from '../services/firebaseService';
import { linkContact } from '../services/identity';
import { track } from '../services/analytics';
import { useVisitor } from '../state/VisitorProvider';
import { AGE_PROBLEM, AgeTick } from './AgeTick';
import { CollectionNotice } from './CollectionNotice';
import { Modal } from './Modal';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';

type Kind = 'run' | 'host' | 'idea';

const KINDS: { value: Kind; label: string; tag: string; purpose: ConsentPurpose }[] = [
  { value: 'run', label: 'Run an event', tag: 'Run', purpose: 'organising' },
  { value: 'host', label: 'Host one at my place', tag: 'Host', purpose: 'space' },
  { value: 'idea', label: 'Suggest an idea', tag: 'Idea', purpose: 'proposal' },
];

/**
 * concept-simple: one short form instead of Propose, I have a space and Help run this. The text
 * goes to suggestions (owner only); the contact goes to users/{uid} with the consent for that
 * purpose, as everywhere else.
 */
export const TellUsSheet = () => {
  const { state, actions } = useVisitor();
  const [kind, setKind] = useState<Kind>('run');
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [age16, setAge16] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const chosen = KINDS.find((k) => k.value === kind)!;

  const close = () => {
    actions.closeSheet();
    if (done) {
      setDone(false);
      setText('');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (text.trim().length < 3) return setError('Tell us a few words about it.');
    const problem = contactProblem(email, phone);
    if (problem) return setError(problem);
    if (!age16) return setError(AGE_PROBLEM);
    if (!consent) return setError('Tick the box so we can reply to you.');
    setError('');
    setBusy(true);
    try {
      await submitSuggestion({ text: `[${chosen.tag}] ${text.trim()}`.slice(0, 1000) });
      await linkContact({
        name,
        email,
        phone,
        purpose: chosen.purpose,
        wantsToOrganise: kind === 'run' || undefined,
        hasSpace: kind === 'host' || undefined,
      });
      track('suggestion_submit', { length: text.trim().length, via: `tellus-${kind}` });
      setDone(true);
    } catch (err) {
      console.error(err);
      setError("That didn't send. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen={state.sheet === 'tellus'} onClose={close} title="Want to run or host something?">
      {done ? (
        <div role="status" className="space-y-3 text-[15px] text-slate-200">
          <p>Thanks. We read every message and reply by WhatsApp or email.</p>
          <button onClick={close} className={primaryButtonClass}>
            Back to the events
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <fieldset>
            <legend className={labelClass}>What would you like to do?</legend>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <label
                  key={k.value}
                  className={`flex min-h-11 cursor-pointer items-center rounded-sheet border px-3 text-[15px] font-semibold ${
                    kind === k.value ? 'border-brand-primary bg-brand-action/25 text-white' : 'border-sheet-line text-slate-200 hover:border-slate-500'
                  }`}
                >
                  <input type="radio" name="tellus-kind" value={k.value} checked={kind === k.value} onChange={() => setKind(k.value)} className="sr-only" />
                  {k.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className={labelClass} htmlFor="tellus-text">
              {kind === 'host' ? 'Where is it, and how many people fit?' : kind === 'run' ? 'What would you run?' : 'What would you go to?'}
            </label>
            <textarea
              id="tellus-text"
              rows={3}
              maxLength={500}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={fieldClass}
              placeholder={kind === 'host' ? 'A common room in my student house, about 20 people' : 'A beginners’ salsa evening'}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="tellus-name">First name (optional)</label>
            <input id="tellus-name" autoComplete="given-name" className={fieldClass} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="tellus-email">Email</label>
            <input id="tellus-email" type="email" autoComplete="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="tellus-phone">or WhatsApp number</label>
            <input
              id="tellus-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="06 12345678"
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <p className="mt-1.5 text-[13px] text-slate-400">One of the two is enough.</p>
          </div>
          <AgeTick id="tellus-age" checked={age16} onChange={setAge16} />
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
            <span className="text-[14px] leading-relaxed text-slate-300">{CONSENT_TEXTS[chosen.purpose]}</span>
          </label>
          {error && <p role="alert" className={errorClass}>{error}</p>}
          <button type="submit" disabled={busy} className={primaryButtonClass}>
            {busy ? 'Sending…' : 'Send'}
          </button>
          <CollectionNotice>This keeps what you wrote, the email or number you give and what you ticked.</CollectionNotice>
        </form>
      )}
    </Modal>
  );
};
