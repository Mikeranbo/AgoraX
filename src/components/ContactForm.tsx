import React, { useState } from 'react';
import { normalisePhone } from '../services/identity';

export interface ContactValues {
  name: string;
  phone: string;
  email: string;
}

interface ContactFormProps {
  onSubmit: (values: ContactValues) => Promise<void>;
  submitLabel?: string;
  onSkip?: () => void;
  skipLabel?: string;
}

export const CONSENT_TEXT =
  "We'll only use this to tell you when an event you picked is happening. Nothing else, and you can ask us to delete it any time.";

const inputClass =
  'w-full glass bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-primary';
const labelClass = 'text-[10px] uppercase font-bold text-slate-500 tracking-widest';

/** WhatsApp number is the primary field; name and email are optional. Consent is required. */
export const ContactForm = ({ onSubmit, submitLabel = 'Save my number', onSkip, skipLabel = 'Not now' }: ContactFormProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const digits = normalisePhone(phone).replace(/\D/g, '');
    const hasPhone = digits.length >= 8;
    const hasEmail = /^\S+@\S+\.\S+$/.test(email.trim());
    if (!hasPhone && !hasEmail) {
      setError('Add a WhatsApp number (or an email) so we can reach you.');
      return;
    }
    if (phone.trim() && !hasPhone) {
      setError("That number looks too short — include the full number, e.g. 06 12345678.");
      return;
    }
    if (email.trim() && !hasEmail) {
      setError("That email doesn't look right.");
      return;
    }
    if (!consent) {
      setError('Please tick the box so we know you are happy for us to message you.');
      return;
    }
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), phone: hasPhone ? phone.trim() : '', email: hasEmail ? email.trim() : '' });
    } catch (err) {
      console.error(err);
      setError("Couldn't save that — check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1">
        <label className={labelClass} htmlFor="cf-name">First name (optional)</label>
        <input id="cf-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="cf-phone">WhatsApp number</label>
        <input
          id="cf-phone"
          type="tel"
          inputMode="tel"
          className={inputClass}
          placeholder="06 12345678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          autoComplete="tel"
        />
      </div>
      <div className="space-y-1">
        <label className={labelClass} htmlFor="cf-email">Email (optional)</label>
        <input id="cf-email" type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-1 h-4 w-4 accent-brand-secondary shrink-0"
        />
        <span className="text-xs text-slate-300 leading-relaxed">{CONSENT_TEXT}</span>
      </label>

      {error && (
        <p role="alert" className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 gradient-brand text-white rounded-2xl font-black text-sm tracking-wide disabled:opacity-60"
      >
        {busy ? 'Saving…' : submitLabel}
      </button>
      {onSkip && (
        <button type="button" onClick={onSkip} className="w-full py-2 text-xs font-bold text-slate-500 hover:text-white transition-colors">
          {skipLabel}
        </button>
      )}
    </form>
  );
};
