import React, { useState } from 'react';
import { EventCategory, PUBLIC_CATEGORIES } from '../types';
import { ProposalFormValues, validateProposal } from '../data/proposals';
import { CONSENT_TEXTS } from '../data/consent';
import { submitProposal } from '../services/firebaseService';
import { track } from '../services/analytics';
import { useVisitor } from '../state/VisitorProvider';
import { errorClass, fieldClass, labelClass, primaryButtonClass } from '../components/ui';

const EMPTY: ProposalFormValues = {
  title: '',
  category: '',
  price: '',
  minPeople: '',
  firstName: '',
  phone: '',
  needs: '',
  consent: false,
};

/** A one-minute form. The idea goes to us first and only shows in the list once approved. */
export const ProposeScreen = () => {
  const { actions } = useVisitor();
  const [v, setV] = useState<ProposalFormValues>(EMPTY);
  const [error, setError] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle');
  const set = <K extends keyof ProposalFormValues>(key: K, value: ProposalFormValues[K]) => setV((prev) => ({ ...prev, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateProposal(v);
    setError(problem ?? '');
    if (problem || !v.category) return;
    setState('busy');
    try {
      await submitProposal({
        title: v.title.trim(),
        category: v.category,
        price: Number(v.price),
        minPeople: Number(v.minPeople),
        needs: v.needs.trim(),
        firstName: v.firstName.trim(),
        phone: v.phone.trim(),
      });
      track('proposal_submit', { category: v.category });
      setState('done');
    } catch (err) {
      console.error(err);
      setError("That didn't send. Check your connection and try again.");
      setState('idle');
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 pt-5 sm:px-6">
      <h1 className="font-display text-[30px] font-bold leading-tight text-white">Propose an event</h1>

      {state === 'done' ? (
        <div className="sheet mt-5 space-y-4 rounded-sheet p-5">
          <p className="text-[16px] leading-relaxed text-slate-200">
            Got it. We'll look at "{v.title.trim()}" and message you on WhatsApp. It goes into the list once we've
            checked it.
          </p>
          <button
            onClick={() => {
              setV(EMPTY);
              setState('idle');
              actions.setTab('events');
            }}
            className={primaryButtonClass}
          >
            Back to Events
          </button>
        </div>
      ) : (
        <>
          <p className="mt-2 mb-5 text-[16px] text-slate-300">Takes a minute. If enough people want it, it happens.</p>
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className={labelClass} htmlFor="p-title">What is it?</label>
              <input id="p-title" maxLength={120} placeholder="Sunday morning run along the Hoornse Meer" className={fieldClass} value={v.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass} htmlFor="p-category">Category</label>
              <select id="p-category" className={fieldClass} value={v.category} onChange={(e) => set('category', e.target.value as EventCategory | '')}>
                <option value="">Choose…</option>
                {PUBLIC_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="p-price">Rough price (€)</label>
                <input id="p-price" type="number" inputMode="decimal" min={0} max={200} placeholder="5" className={fieldClass} value={v.price} onChange={(e) => set('price', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-min">People it needs</label>
                <input id="p-min" type="number" inputMode="numeric" min={2} max={200} placeholder="10" className={fieldClass} value={v.minPeople} onChange={(e) => set('minPeople', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="p-needs">What would you need to make it happen?</label>
              <textarea id="p-needs" maxLength={500} placeholder="A room for 15, a projector, someone who knows the route…" className={`${fieldClass} min-h-[88px]`} value={v.needs} onChange={(e) => set('needs', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="p-name">First name</label>
                <input id="p-name" autoComplete="given-name" maxLength={80} className={fieldClass} value={v.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className={labelClass} htmlFor="p-phone">WhatsApp</label>
                <input id="p-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="06 12345678" className={fieldClass} value={v.phone} onChange={(e) => set('phone', e.target.value)} />
              </div>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" checked={v.consent} onChange={(e) => set('consent', e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
              <span className="text-[14px] leading-relaxed text-slate-300">{CONSENT_TEXTS.proposal}</span>
            </label>
            {error && <p role="alert" className={errorClass}>{error}</p>}
            <button type="submit" disabled={state === 'busy'} className={primaryButtonClass}>
              {state === 'busy' ? 'Sending…' : 'Send it'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};
