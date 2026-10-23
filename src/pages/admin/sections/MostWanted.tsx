import React, { useEffect, useMemo, useState } from 'react';
import { subscribeFeatureSignals, FeatureSignal } from '../../../services/adminService';
import { featureLabel } from '../../../data/features';
import { downloadCsv } from '../../../lib/csv';
import { Bar, Section, Table, Td } from '../ui';

/** Locked sidebar features ranked by distinct people who said "I want this", then by taps. */
export function MostWanted() {
  const [signals, setSignals] = useState<FeatureSignal[]>([]);
  const [error, setError] = useState('');
  useEffect(() => subscribeFeatureSignals(setSignals, (e) => setError(e.message)), []);

  const rows = useMemo(() => {
    const byFeature = new Map<string, { voters: Set<string>; taps: number; tappers: Set<string> }>();
    for (const s of signals) {
      if (!s.feature) continue;
      const row = byFeature.get(s.feature) ?? { voters: new Set<string>(), taps: 0, tappers: new Set<string>() };
      if (s.name === 'feature_vote') row.voters.add(s.uid);
      else {
        row.taps++;
        row.tappers.add(s.uid);
      }
      byFeature.set(s.feature, row);
    }
    return [...byFeature.entries()]
      .map(([feature, r]) => ({ feature, votes: r.voters.size, taps: r.taps, people: r.tappers.size }))
      .sort((a, b) => b.votes - a.votes || b.people - a.people);
  }, [signals]);

  const top = rows[0]?.votes || 1;
  const exportRows = () =>
    downloadCsv('agorax-most-wanted', ['feature', 'people who want it', 'taps', 'people who tapped'], rows.map((r) => [featureLabel(r.feature), r.votes, r.taps, r.people]));

  return (
    <Section title="Most wanted features" subtitle="Locked items in the sidebar: “I want this” votes (one per person) and taps" onExport={exportRows}>
      {error && <p className="text-xs text-red-300 mb-2">Could not load: {error}</p>}
      <Table head={['#', 'Feature', 'Want it', '', 'Taps', 'People who tapped']} empty="No taps on locked features yet.">
        {rows.map((r, i) => (
          <tr key={r.feature}>
            <Td className="tabular-nums">{i + 1}</Td>
            <Td className="text-white font-bold">{featureLabel(r.feature)}</Td>
            <Td className="tabular-nums">{r.votes}</Td>
            <Td><Bar value={r.votes} max={top} /></Td>
            <Td className="tabular-nums">{r.taps}</Td>
            <Td className="tabular-nums">{r.people}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
