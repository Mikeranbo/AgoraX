import React from 'react';
import { useAdmin } from '../AdminContext';
import { Bar, Section, pct } from '../ui';

export function Funnel() {
  const { stats } = useAdmin().state;
  const funnel = [
    { label: 'Card impressions', n: stats.impressions },
    { label: 'Card opens', n: stats.opens },
    { label: 'Joins', n: stats.totalJoins },
    { label: 'Contact submitted', n: stats.contacts },
  ];
  return (
    <Section title="Funnel" subtitle="Counters kept on each event — no analytics scan">
      <div className="glass rounded-2xl p-4 space-y-3">
        {funnel.map((step, i) => (
          <div key={step.label} className="grid grid-cols-[8rem_1fr] sm:grid-cols-[9rem_1fr_16rem] items-center gap-x-3 gap-y-1 text-xs">
            <span className="text-slate-300 font-bold">{step.label}</span>
            <Bar className="w-full" value={step.n} max={funnel[0].n || step.n || 1} color={i === 0 ? 'bg-slate-500' : 'bg-brand-secondary'} />
            <span className="col-span-2 sm:col-span-1 text-right tabular-nums text-slate-400">
              <span className="text-white font-bold">{step.n}</span>
              {i > 0 && <> · {pct(step.n, funnel[i - 1].n)} of prev · {pct(step.n, funnel[0].n)} of all</>}
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}
