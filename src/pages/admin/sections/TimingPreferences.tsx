import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, pct } from '../ui';
import { downloadCsv } from '../../../lib/csv';

/** When the people interested in each event say it would suit them. A preference, not a promise. */
export function TimingPreferences() {
  const {
    state: { timingRows },
    meta: { canEdit },
  } = useAdmin();
  if (!canEdit) return null;
  const exportTiming = () =>
    downloadCsv(
      'agorax-timing',
      ['event', 'interested', 'weekday_evening', 'weekend', 'flexible', 'not_said'],
      timingRows.map((r) => [r.event.title, r.total, r['weekday-evening'], r.weekend, r.flexible, r.unknown]),
    );
  return (
    <Section title="Preferred timing" subtitle="Among people interested in each event · a preference, not availability" onExport={exportTiming}>
      <Table head={['Event', 'Interested', 'Weekday evening', 'Weekend', 'Flexible', 'Not said']} empty="No interest yet.">
        {timingRows.map((r) => (
          <tr key={r.event.id}>
            <Td className="text-white font-bold">{r.event.title}</Td>
            <Td className="tabular-nums">{r.total}</Td>
            <Td className="tabular-nums">{pct(r['weekday-evening'], r.total)}</Td>
            <Td className="tabular-nums">{pct(r.weekend, r.total)}</Td>
            <Td className="tabular-nums">{pct(r.flexible, r.total)}</Td>
            <Td className="tabular-nums text-slate-400">{pct(r.unknown, r.total)}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
