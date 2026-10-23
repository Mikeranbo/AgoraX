import React, { useState } from 'react';
import { CONSENT_TEXTS, ConsentPurpose } from '../data/consent';
import { contactProblem } from '../data/forms';
import { PRIVACY_NOTICE_FINAL } from '../config/pilot';
import { CollectionNotice } from './CollectionNotice';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from './ui';

export interface ContactValues {
  phone: string;
  email: string;
  /** Optional purposes the person ticked (launch news, invitations). Never pre-ticked. */
  alsoConsent: ConsentPurpose[];
}

const Tick = ({ checked, onChange, children }: { checked: boolean; onChange: (on: boolean) => void; children: React.ReactNode }) => (
  <label className="flex cursor-pointer items-start gap-3">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
    <span className="text-[14px] leading-relaxed text-slate-300">{children}</span>
  </label>
);

/**
 * An email or a WhatsApp number (either is enough), the one consent this form is for, and,
 * once the privacy notice is final, two optional email-only extras that start unticked.
 */
export const ContactForm = ({ onSubmit }: { onSubmit: (values: ContactValues) => Promise<void> }) => {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [launch, setLaunch] = useState(false);
  const [invites, setInvites] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const extrasNeedEmail = (launch || invites) && !email.trim();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const problem = contactProblem(email, phone);
    if (problem) return setError(problem);
    if (!consent) return setError('Tick the first box so we can tell you about your events.');
    if (extrasNeedEmail) return setError('Launch news and invitations only go by email. Add an email or untick them.');
    setError('');
    setBusy(true);
    try {
      const alsoConsent: ConsentPurpose[] = [...(launch ? (['launch'] as const) : []), ...(invites ? (['invites'] as const) : [])];
      await onSubmit({ phone: phone.trim(), email: email.trim(), alsoConsent });
    } catch (err) {
      console.error(err);
      setError("That didn't save. Check your connection and try again.");
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label className={labelClass} htmlFor="cf-email">Email</label>
        <input id="cf-email" type="email" autoComplete="email" className={fieldClass} value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <label className={labelClass} htmlFor="cf-phone">or WhatsApp number</label>
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
        <p className="mt-1.5 text-[13px] text-slate-400">One of the two is enough. A number is only used to message you about your events, never for marketing.</p>
      </div>
      <Tick checked={consent} onChange={setConsent}>{CONSENT_TEXTS.updates}</Tick>
      {PRIVACY_NOTICE_FINAL && (
        <>
          <Tick checked={launch} onChange={setLaunch}>{CONSENT_TEXTS.launch}</Tick>
          <Tick checked={invites} onChange={setInvites}>{CONSENT_TEXTS.invites}</Tick>
        </>
      )}
      <p className="text-[13px] leading-relaxed text-slate-400">
        We contact people by hand during the pilot. There is no automatic mailing list.
      </p>
      {error && <p role="alert" className={errorClass}>{error}</p>}
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? 'Saving…' : 'Save'}
      </button>
      <CollectionNotice>This keeps the email or number you give and what you ticked.</CollectionNotice>
    </form>
  );
};
