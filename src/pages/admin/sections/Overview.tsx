import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Tile, pct } from '../ui';

/** APP_CHANGES §12 numbers, then the build plan's targets so every number has context. */
export function Overview() {
  const { stats, venueOffers, proposals, targets } = useAdmin().state;
  const waiting = proposals.filter((p) => p.status === 'new').length;
  return (
    <Section title="Overview" subtitle="Live — updates as people use the site">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Visitors" value={stats.visitors} hint="distinct phones (uids in users)" />
        <Tile label="Total joins" value={stats.totalJoins} hint="participant documents" />
        <Tile label="People who joined" value={stats.joiners} hint="at least one event" />
        <Tile label="Contacts left" value={stats.contacts} hint={`${pct(stats.contacts, stats.visitors)} of visitors`} />
        <Tile label="Avg events picked" value={stats.avgPicks.toFixed(1)} hint="per person who joined" />
        <Tile label="Help-run taps" value={stats.organiserTaps} hint="one per person per event" />
        <Tile label="Space offers" value={venueOffers.length} />
        <Tile label="Proposals" value={proposals.length} hint={waiting ? `${waiting} waiting for you` : 'none waiting'} />
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3" aria-label="Targets from the build plan">
        {targets.map((t) => (
          <div
            key={t.label}
            title={t.how}
            className={`rounded-2xl p-3 border ${t.met ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/[0.03]'}`}
          >
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">{t.label}</p>
            <p className="mt-1 tabular-nums">
              <span className={`text-lg font-display font-black ${t.met ? 'text-green-300' : 'text-white'}`}>
                {t.actual}
                {t.unit}
              </span>
              <span className="text-xs text-slate-500">
                {' '}
                / {t.target}
                {t.unit}
              </span>
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t.met ? 'Target met' : t.how}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
