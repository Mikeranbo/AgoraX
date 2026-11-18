import React from 'react';

/** Shown when someone sends contact details without confirming their age. */
export const AGE_PROBLEM = "Tick that you're 16 or older. We can't keep contact details for anyone younger.";

/**
 * "I'm 16 or older": asked before any email or number is saved. In the Netherlands, consent to
 * use personal data is only valid on its own from 16 (GDPR art. 8, UAVG art. 5). Never pre-ticked.
 */
export const AgeTick = ({ checked, onChange, id }: { checked: boolean; onChange: (on: boolean) => void; id: string }) => (
  <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
    <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-brand-action" />
    <span className="text-[14px] leading-relaxed text-slate-300">I'm 16 or older.</span>
  </label>
);
