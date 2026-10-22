import React, { useState } from 'react';
import { CONSENT_TEXTS } from '../data/consent';
import { hasValidEmail, hasValidPhone } from '../data/forms';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';

export interface ContactValues {
  phone: string;
  email: string;
}

/** WhatsApp is the main field, email is optional, consent is required. Nothing else is asked. */
export const ContactForm = ({ onSubmit }: { onSubmit: (values: ContactValues) => Promise<void> }) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasValidPhone(phone)) return setError('Add your WhatsApp number, for example 06 12345678.');
    if (email.trim() && !hasValidEmail(email)) return setError("That email doesn't look right.");
    if (!consent) return setError('Tick the box so we can message you.');
    setError('');
    setBusy(true);
    try {
      await onSubmit({ phone: phone.trim(), email: email.trim() });
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className={labelClass} htmlFor="cf-phone">WhatsApp number</label>
        <input
          id="cf-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="06 12345678"
          className={fieldClass}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div>
        <label className={labelClass} htmlFor="cf-email">Email (optional)</label>
        <input id="cf-email" type="email" autoComplete="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
        <span className="text-[14px] leading-relaxed text-slate-300">{CONSENT_TEXTS.updates}</span>
      </label>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Save my number'}
      </button>
    </form>
  );
};
