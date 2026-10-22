import React from 'react';
import { useAdmin } from '../AdminContext';
import { Section, Table, Td, pct } from '../ui';
import { downloadCsv } from '../../../lib/csv';

export function PriceAnswers() {
  const { ladderRows } = useAdmin().state;
  const exportLadder = () =>
    downloadCsv(
      'agorax-price-ladder',
      ['event', 'price_asked', 'answers', 'yes', 'no', 'depends'],
      ladderRows.map((r) => [r.event.title, r.priceAsked, r.total, r.yes, r.no, r.depends]),
    );
  return (
    <Section title="Price ladder" subtitle="“Would you still come at the next price?”" onExport={exportLadder}>
      <Table head={['Event', 'Asked at €', 'Answers', 'Yes', 'No', 'Depends']} empty="No answers yet.">
        {ladderRows.map((r) => (
          <tr key={r.event.id}>
            <Td className="text-white font-bold">{r.event.title}</Td>
            <Td className="tabular-nums">{r.priceAsked}</Td>
            <Td className="tabular-nums">{r.total}</Td>
            <Td className="tabular-nums text-green-300">{pct(r.yes, r.total)}</Td>
            <Td className="tabular-nums text-red-300">{pct(r.no, r.total)}</Td>
            <Td className="tabular-nums text-amber-200">{pct(r.depends, r.total)}</Td>
          </tr>
        ))}
      </Table>
    </Section>
  );
}
