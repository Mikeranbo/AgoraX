import React from 'react';

/** "Agora" + a cyan "X" + the Pilot pill, in Plus Jakarta Sans. */
export const Logo = ({ size = 22 }: { size?: number }) => (
  <span className="inline-flex items-center gap-2.5 font-extrabold tracking-tight text-white" style={{ fontFamily: 'var(--font-brand)', fontSize: size }}>
    <span>
      Agora<span className="text-x-cyan">X</span>
    </span>
    <span className="rounded-full border px-2.5 py-0.5 text-[13px] font-semibold text-white" style={{ borderColor: 'rgba(255,255,255,.35)' }}>
      Pilot
    </span>
  </span>
);
