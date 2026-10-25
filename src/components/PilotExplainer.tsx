import React from 'react';

/**
 * What the pilot is and isn't, in full, where everyone sees it before the list. The three
 * distinctions that must survive any edit: these are estimates, not offers; interest is not a
 * booking or a payment; and only 1–3 well-supported, feasible events are aimed for.
 */
export const PilotExplainer = () => (
  <div className="sheet max-w-[62ch] space-y-3 rounded-sheet p-4 text-[16px] leading-relaxed text-pretty text-slate-200 sm:p-5">
    <p>
      <strong className="font-semibold text-white">AgoraX is a pilot, not a booking service.</strong> The event ideas, prices and
      organiser earnings here are estimates, not confirmed offers or guaranteed income.
    </p>
    <p>
      If enough people are interested and we can find suitable hosts and venues, we aim to run one to three of the most-supported
      events.
    </p>
    <p>
      Pick the activities you'd really go to at the price shown. Saying you're interested isn't a booking: you don't pay anything,
      and it doesn't guarantee the event will happen.
    </p>
  </div>
);
